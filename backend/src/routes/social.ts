import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { SocialAccount } from '../models/SocialAccount';
import { twitterService } from '../services/twitterService';
import { linkedInService } from '../services/linkedInService';
import { instagramService } from '../services/instagramService';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Get connected social accounts
router.get('/accounts', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const accounts = await SocialAccount.find({ 
      userId: req.user!.id,
      isActive: true 
    }).select('-accessToken -refreshToken');

    res.json({
      success: true,
      data: accounts.map(account => ({
        id: account._id,
        platform: account.platform,
        username: account.username,
        platformUserId: account.platformUserId,
        isActive: account.isActive,
        metadata: account.metadata,
        connectedAt: account.createdAt,
        expiresAt: account.expiresAt
      }))
    });

  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to get social accounts' });
  }
});

// Disconnect a social account
router.delete('/accounts/:platform', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { platform } = req.params;

    if (!['twitter', 'linkedin', 'instagram'].includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    const account = await SocialAccount.findOneAndUpdate(
      { 
        userId: req.user!.id, 
        platform 
      },
      { isActive: false },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ error: 'Social account not found' });
    }

    res.json({
      success: true,
      message: `${platform} account disconnected successfully`
    });

  } catch (error) {
    console.error('Disconnect account error:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

// TWITTER OAUTH ROUTES

// Start Twitter OAuth flow
router.get('/twitter/auth', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { url, codeVerifier, state } = await twitterService.getAuthUrl(req.user!.id);
    
    // Store code verifier in session or temporary storage
    // For this example, we'll return it to the client (not secure for production)
    res.json({
      success: true,
      data: {
        authUrl: url,
        state,
        // WARNING: Don't send codeVerifier to client in production
        // Store it securely on server and retrieve using state parameter
        codeVerifier
      }
    });

  } catch (error) {
    console.error('Twitter auth start error:', error);
    res.status(500).json({ error: 'Failed to start Twitter authentication' });
  }
});

// Handle Twitter OAuth callback
router.post('/twitter/callback', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { code, state, codeVerifier } = req.body;

    if (!code || !state || !codeVerifier) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    await twitterService.handleCallback(code, codeVerifier, state);

    res.json({
      success: true,
      message: 'Twitter account connected successfully'
    });

  } catch (error) {
    console.error('Twitter callback error:', error);
    res.status(500).json({ error: 'Failed to connect Twitter account' });
  }
});

// LINKEDIN OAUTH ROUTES

// Start LinkedIn OAuth flow
router.get('/linkedin/auth', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const authUrl = await linkedInService.getAuthUrl(req.user!.id);
    
    res.json({
      success: true,
      data: {
        authUrl
      }
    });

  } catch (error) {
    console.error('LinkedIn auth start error:', error);
    res.status(500).json({ error: 'Failed to start LinkedIn authentication' });
  }
});

// Handle LinkedIn OAuth callback
router.post('/linkedin/callback', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { code, state } = req.body;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    await linkedInService.handleCallback(code, state);

    res.json({
      success: true,
      message: 'LinkedIn account connected successfully'
    });

  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.status(500).json({ error: 'Failed to connect LinkedIn account' });
  }
});

// INSTAGRAM OAUTH ROUTES

// Start Instagram OAuth flow
router.get('/instagram/auth', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const authUrl = await instagramService.getAuthUrl(req.user!.id);
    
    res.json({
      success: true,
      data: {
        authUrl
      }
    });

  } catch (error) {
    console.error('Instagram auth start error:', error);
    res.status(500).json({ error: 'Failed to start Instagram authentication' });
  }
});

// Handle Instagram OAuth callback
router.post('/instagram/callback', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { code, state } = req.body;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    await instagramService.handleCallback(code, state);

    res.json({
      success: true,
      message: 'Instagram account connected successfully'
    });

  } catch (error) {
    console.error('Instagram callback error:', error);
    res.status(500).json({ error: 'Failed to connect Instagram account' });
  }
});

// Test posting to a platform (for development/testing)
router.post('/test-post', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { platform, content, imageUrl } = req.body;

    if (!platform || !content) {
      return res.status(400).json({ error: 'Platform and content are required' });
    }

    if (!['twitter', 'linkedin', 'instagram'].includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    // Get social account
    const socialAccount = await SocialAccount.findOne({
      userId: req.user!.id,
      platform,
      isActive: true
    });

    if (!socialAccount) {
      return res.status(404).json({ error: `No active ${platform} account found` });
    }

    let result;

    // Test post to the platform
    switch (platform) {
      case 'twitter':
        result = await twitterService.postTweet(content, imageUrl, socialAccount.accessToken);
        break;
      case 'linkedin':
        result = await linkedInService.postToLinkedIn(content, imageUrl, socialAccount.accessToken);
        break;
      case 'instagram':
        if (!imageUrl) {
          return res.status(400).json({ error: 'Instagram posts require an image' });
        }
        result = await instagramService.postToInstagram(content, imageUrl, socialAccount.accessToken);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }

    res.json({
      success: true,
      message: `Test post published to ${platform}`,
      data: {
        platform,
        publishedId: result,
        publishedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Test post error:', error);
    res.status(500).json({ 
      error: 'Failed to publish test post',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;