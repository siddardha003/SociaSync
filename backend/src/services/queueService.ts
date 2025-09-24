import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { Post } from '../models/Post';
import { SocialAccount } from '../models/SocialAccount';
import { twitterService } from './twitterService';
import { linkedInService } from './linkedInService';
import { instagramService } from './instagramService';
import { JobData } from '../types';

// Lazy initialization variables
let connection: Redis | null = null;
let postQueue: Queue | null = null;
let worker: Worker | null = null;
let isRedisEnabled = false;

// Get Redis connection with lazy initialization
const getRedisConnection = () => {
  if (!connection) {
    try {
      connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });

      connection.on('error', (err) => {
        console.error('Redis connection error:', err);
        isRedisEnabled = false;
      });

      connection.on('connect', () => {
        console.log('✅ Connected to Redis (queueService)');
        isRedisEnabled = true;
      });

      isRedisEnabled = true;
    } catch (error) {
      console.error('Failed to create Redis connection:', error);
      isRedisEnabled = false;
    }
  }
  return connection;
};

// Get queue with lazy initialization
const getPostQueue = () => {
  if (!postQueue && isRedisEnabled) {
    try {
      const redisConnection = getRedisConnection();
      if (redisConnection) {
        postQueue = new Queue('social-media-posts', { 
          connection: redisConnection,
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          }
        });
      }
    } catch (error) {
      console.error('Failed to create post queue:', error);
      isRedisEnabled = false;
    }
  }
  return postQueue;
};

// Get worker with lazy initialization
const getWorker = () => {
  if (!worker && isRedisEnabled) {
    try {
      const redisConnection = getRedisConnection();
      if (redisConnection) {
        worker = new Worker('social-media-posts', async (job: Job<JobData>) => {
  console.log(`Processing job ${job.id} for post ${job.data.postId}`);
  
  const { postId, userId, platforms, content, imageUrl } = job.data;

  try {
    // Get the post from database
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    // Update post status to publishing
    await Post.findByIdAndUpdate(postId, { 
      status: 'published',
      publishedAt: new Date()
    });

    const results = [];

    // Process each platform
    for (const platform of platforms) {
      try {
        console.log(`Publishing to ${platform}...`);
        
        // Get social account for this platform
        const socialAccount = await SocialAccount.findOne({
          userId,
          platform,
          isActive: true
        });

        if (!socialAccount) {
          throw new Error(`No active ${platform} account found for user ${userId}`);
        }

        let publishedId: string;

        // Post to the respective platform
        switch (platform) {
          case 'twitter':
            publishedId = await twitterService.postTweet(
              content, 
              imageUrl, 
              socialAccount.accessToken
            );
            break;

          case 'linkedin':
            publishedId = await linkedInService.postToLinkedIn(
              content, 
              imageUrl, 
              socialAccount.accessToken
            );
            break;

          case 'instagram':
            if (!imageUrl) {
              throw new Error('Instagram posts require an image');
            }
            publishedId = await instagramService.postToInstagram(
              content, 
              imageUrl, 
              socialAccount.accessToken
            );
            break;

          default:
            throw new Error(`Unsupported platform: ${platform}`);
        }

        results.push({
          platform,
          success: true,
          publishedId,
          publishedAt: new Date()
        });

        console.log(`✅ Successfully published to ${platform}: ${publishedId}`);

      } catch (platformError) {
        console.error(`❌ Failed to publish to ${platform}:`, platformError);
        
        results.push({
          platform,
          success: false,
          error: platformError instanceof Error ? platformError.message : 'Unknown error',
          publishedAt: new Date()
        });
      }
    }

    // Update post with results
    const hasFailures = results.some(r => !r.success);
    await Post.findByIdAndUpdate(postId, {
      publishResults: results,
      status: hasFailures ? 'failed' : 'published'
    });

    // If there were failures, throw an error to trigger retry
    if (hasFailures && results.every(r => !r.success)) {
      throw new Error('Failed to publish to all platforms');
    }

    return { success: true, results };

  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    
    // Update post status
    await Post.findByIdAndUpdate(postId, {
      status: 'failed',
      $inc: { retryCount: 1 }
    });

    throw error;
  }
}, { 
  connection: redisConnection,
  concurrency: 5 
});

        // Error handling
        worker.on('failed', (job, err) => {
          console.error(`Job ${job?.id} failed:`, err);
        });

        worker.on('completed', (job) => {
          console.log(`Job ${job.id} completed successfully`);
        });
      }
    } catch (error) {
      console.error('Failed to create worker:', error);
      isRedisEnabled = false;
    }
  }
  return worker;
};

// Initialize Redis (called when needed)
export const initializeQueue = async () => {
  try {
    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
      const redisConnection = getRedisConnection();
      if (redisConnection) {
        await redisConnection.connect();
        getPostQueue();
        getWorker();
      }
    } else {
      console.log('⚠️  Redis not configured - queue functionality disabled');
    }
  } catch (error) {
    console.error('Failed to initialize queue:', error);
    isRedisEnabled = false;
  }
};

// Queue management functions
export class QueueService {
  static async schedulePost(postId: string, userId: string, scheduledAt: Date, platforms: string[], content: string, imageUrl?: string): Promise<string> {
    if (!isRedisEnabled) {
      throw new Error('Queue service is not available - Redis not connected');
    }

    const queue = getPostQueue();
    if (!queue) {
      throw new Error('Post queue is not available');
    }

    const delay = scheduledAt.getTime() - Date.now();
    
    if (delay <= 0) {
      throw new Error('Scheduled time must be in the future');
    }

    const job = await queue.add(
      'publish-post',
      {
        postId,
        userId,
        platforms,
        content,
        imageUrl
      } as JobData,
      {
        delay,
        jobId: `post-${postId}-${Date.now()}`
      }
    );

    return job.id!;
  }

  static async cancelScheduledPost(jobId: string): Promise<boolean> {
    try {
      if (!isRedisEnabled) {
        console.warn('Queue service is not available - cannot cancel scheduled post');
        return false;
      }

      const queue = getPostQueue();
      if (!queue) return false;

      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to cancel job:', error);
      return false;
    }
  }

  static async getQueueStats() {
    if (!isRedisEnabled) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0
      };
    }

    const queue = getPostQueue();
    if (!queue) return null;

    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();
    const delayed = await queue.getDelayed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length
    };
  }

  static async publishNow(postId: string, userId: string, platforms: string[], content: string, imageUrl?: string): Promise<string> {
    if (!isRedisEnabled) {
      throw new Error('Queue service is not available - Redis not connected');
    }

    const queue = getPostQueue();
    if (!queue) {
      throw new Error('Post queue is not available');
    }

    const job = await queue.add(
      'publish-post-now',
      {
        postId,
        userId,
        platforms,
        content,
        imageUrl
      } as JobData,
      {
        priority: 1, // High priority for immediate posts
        jobId: `post-now-${postId}-${Date.now()}`
      }
    );

    return job.id!;
  }
}

// Export lazy-initialized instances
export const getQueue = () => getPostQueue();
export const getQueueWorker = () => getWorker();