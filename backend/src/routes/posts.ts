import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { Post } from '../models/Post';
import { SocialAccount } from '../models/SocialAccount';
import { QueueService } from '../services/queueService';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Get all posts for the authenticated user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      status, 
      platform, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter: any = { userId: req.user!.id };

    // Add status filter
    if (status && typeof status === 'string') {
      if (['draft', 'scheduled', 'published', 'failed'].includes(status)) {
        filter.status = status;
      }
    }

    // Add platform filter
    if (platform && typeof platform === 'string') {
      if (['twitter', 'linkedin', 'instagram'].includes(platform)) {
        filter.platforms = { $in: [platform] };
      }
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const [posts, totalCount] = await Promise.all([
      Post.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Post.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Get a specific post
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      userId: req.user!.id
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
});

// Create a new post (draft)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      content, 
      imageUrl, 
      imagePrompt,
      platforms,
      scheduledAt,
      metadata 
    } = req.body;

    // Validation
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'At least one platform is required' });
    }

    // Validate platforms
    const validPlatforms = ['twitter', 'linkedin', 'instagram'];
    const invalidPlatforms = platforms.filter(p => !validPlatforms.includes(p));
    if (invalidPlatforms.length > 0) {
      return res.status(400).json({ 
        error: `Invalid platforms: ${invalidPlatforms.join(', ')}` 
      });
    }

    // Check if user has connected accounts for these platforms
    const connectedAccounts = await SocialAccount.find({
      userId: req.user!.id,
      platform: { $in: platforms },
      isActive: true
    });

    const connectedPlatforms = connectedAccounts.map(acc => acc.platform);
    const missingPlatforms = platforms.filter(p => !connectedPlatforms.includes(p));

    if (missingPlatforms.length > 0) {
      return res.status(400).json({
        error: `Please connect your accounts for: ${missingPlatforms.join(', ')}`
      });
    }

    // Create post
    const postData: any = {
      userId: req.user!.id,
      content,
      platforms,
      status: 'draft'
    };

    if (imageUrl) postData.imageUrl = imageUrl;
    if (imagePrompt) postData.imagePrompt = imagePrompt;
    if (metadata) postData.metadata = metadata;

    // Handle scheduling
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({ error: 'Scheduled time must be in the future' });
      }
      postData.scheduledAt = scheduledDate;
      postData.status = 'scheduled';
    }

    const post = new Post(postData);
    await post.save();

    // Schedule the post if needed
    if (post.status === 'scheduled') {
      const jobId = await QueueService.schedulePost(
        (post._id as any).toString(),
        req.user!.id,
        post.scheduledAt!,
        post.platforms,
        post.content,
        post.imageUrl
      );
      
      post.jobId = jobId;
      await post.save();
    }

    res.status(201).json({
      success: true,
      message: post.status === 'scheduled' ? 'Post scheduled successfully' : 'Draft saved successfully',
      data: post
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update a post
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      content, 
      imageUrl, 
      imagePrompt,
      platforms,
      scheduledAt,
      metadata 
    } = req.body;

    const post = await Post.findOne({
      _id: req.params.id,
      userId: req.user!.id
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Can't edit published posts
    if (post.status === 'published') {
      return res.status(400).json({ error: 'Cannot edit published posts' });
    }

    // Cancel existing scheduled job if updating scheduled post
    if (post.status === 'scheduled' && post.jobId) {
      await QueueService.cancelScheduledPost(post.jobId);
    }

    // Update fields
    if (content !== undefined) post.content = content;
    if (imageUrl !== undefined) post.imageUrl = imageUrl;
    if (imagePrompt !== undefined) post.imagePrompt = imagePrompt;
    if (platforms !== undefined) post.platforms = platforms;
    if (metadata !== undefined) post.metadata = metadata;

    // Handle scheduling changes
    if (scheduledAt !== undefined) {
      if (scheduledAt) {
        const scheduledDate = new Date(scheduledAt);
        if (scheduledDate <= new Date()) {
          return res.status(400).json({ error: 'Scheduled time must be in the future' });
        }
        post.scheduledAt = scheduledDate;
        post.status = 'scheduled';

        // Schedule new job
        const jobId = await QueueService.schedulePost(
          (post._id as any).toString(),
          req.user!.id,
          post.scheduledAt,
          post.platforms,
          post.content,
          post.imageUrl
        );
        post.jobId = jobId;
      } else {
        // Remove scheduling
        post.scheduledAt = undefined;
        post.status = 'draft';
        post.jobId = undefined;
      }
    }

    await post.save();

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: post
    });

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete a post
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      userId: req.user!.id
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Cancel scheduled job if exists
    if (post.status === 'scheduled' && post.jobId) {
      await QueueService.cancelScheduledPost(post.jobId);
    }

    await Post.findByIdAndDelete(post._id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Publish a post immediately
router.post('/:id/publish', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      userId: req.user!.id
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.status === 'published') {
      return res.status(400).json({ error: 'Post is already published' });
    }

    // Cancel scheduled job if exists
    if (post.status === 'scheduled' && post.jobId) {
      await QueueService.cancelScheduledPost(post.jobId);
    }

    // Queue for immediate publishing
    const jobId = await QueueService.publishNow(
      (post._id as any).toString(),
      req.user!.id,
      post.platforms,
      post.content,
      post.imageUrl
    );

    // Update post status
    post.status = 'published';
    post.publishedAt = new Date();
    post.jobId = jobId;
    await post.save();

    res.json({
      success: true,
      message: 'Post queued for publishing',
      data: post
    });

  } catch (error) {
    console.error('Publish post error:', error);
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

// Get post analytics/stats (placeholder)
router.get('/:id/analytics', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      userId: req.user!.id
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // TODO: Implement actual analytics from social platforms
    const analytics = {
      platforms: post.platforms.map(platform => ({
        platform,
        metrics: {
          views: Math.floor(Math.random() * 1000),
          likes: Math.floor(Math.random() * 100),
          shares: Math.floor(Math.random() * 50),
          comments: Math.floor(Math.random() * 25),
          clicks: Math.floor(Math.random() * 75)
        },
        lastUpdated: new Date().toISOString()
      })),
      summary: {
        totalViews: 0,
        totalEngagement: 0,
        engagementRate: '0%'
      }
    };

    // Calculate summary
    analytics.summary.totalViews = analytics.platforms.reduce((sum, p) => sum + p.metrics.views, 0);
    analytics.summary.totalEngagement = analytics.platforms.reduce((sum, p) => 
      sum + p.metrics.likes + p.metrics.shares + p.metrics.comments, 0
    );
    analytics.summary.engagementRate = analytics.summary.totalViews > 0 
      ? `${((analytics.summary.totalEngagement / analytics.summary.totalViews) * 100).toFixed(1)}%`
      : '0%';

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get post analytics' });
  }
});

// Get dashboard stats
router.get('/dashboard/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const [
      totalPosts,
      publishedPosts,
      scheduledPosts,
      draftPosts,
      failedPosts
    ] = await Promise.all([
      Post.countDocuments({ userId }),
      Post.countDocuments({ userId, status: 'published' }),
      Post.countDocuments({ userId, status: 'scheduled' }),
      Post.countDocuments({ userId, status: 'draft' }),
      Post.countDocuments({ userId, status: 'failed' })
    ]);

    // Get recent posts
    const recentPosts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('content status platforms createdAt publishedAt');

    // Get upcoming scheduled posts
    const upcomingPosts = await Post.find({ 
      userId, 
      status: 'scheduled',
      scheduledAt: { $gt: new Date() }
    })
      .sort({ scheduledAt: 1 })
      .limit(5)
      .select('content platforms scheduledAt');

    res.json({
      success: true,
      data: {
        stats: {
          total: totalPosts,
          published: publishedPosts,
          scheduled: scheduledPosts,
          drafts: draftPosts,
          failed: failedPosts
        },
        recentPosts,
        upcomingPosts
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

export default router;