import { TwitterApi } from 'twitter-api-v2';
import { SocialAccount } from '../models/SocialAccount';

export class TwitterService {
  private client: TwitterApi | null = null;

  private getClient(): TwitterApi {
    if (!this.client) {
      if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
        throw new Error('Twitter credentials not configured. Please set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET environment variables.');
      }
      
      this.client = new TwitterApi({
        appKey: process.env.TWITTER_CLIENT_ID,
        appSecret: process.env.TWITTER_CLIENT_SECRET,
      });
    }
    return this.client;
  }

  async getAuthUrl(userId: string): Promise<{ url: string; codeVerifier: string; state: string }> {
    const client = this.getClient();
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      `${process.env.FRONTEND_URL}/auth/twitter/callback`,
      { 
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
        state: JSON.stringify({ userId, platform: 'twitter' })
      }
    );

    return { url, codeVerifier, state };
  }

  async handleCallback(code: string, codeVerifier: string, state: string): Promise<void> {
    const stateData = JSON.parse(state);
    const { userId } = stateData;

    try {
      const client = this.getClient();
      const { accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: `${process.env.FRONTEND_URL}/auth/twitter/callback`,
      });

      // Get user info
      const userClient = new TwitterApi(accessToken);
      const userInfo = await userClient.v2.me();

      // Save or update social account
      await SocialAccount.findOneAndUpdate(
        { userId, platform: 'twitter' },
        {
          platformUserId: userInfo.data.id,
          username: userInfo.data.username,
          accessToken,
          refreshToken,
          expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
          isActive: true,
          metadata: {
            displayName: userInfo.data.name,
            profilePicture: userInfo.data.profile_image_url
          }
        },
        { upsert: true, new: true }
      );

    } catch (error) {
      console.error('Twitter OAuth callback error:', error);
      throw new Error('Failed to connect Twitter account');
    }
  }

  async postTweet(content: string, imageUrl?: string, accessToken?: string): Promise<string> {
    if (!accessToken) {
      throw new Error('Twitter access token required');
    }

    try {
      const userClient = new TwitterApi(accessToken);
      
      let mediaId: string | undefined;
      
      // TODO: Implement image upload if imageUrl is provided
      // This requires downloading the image and uploading to Twitter
      if (imageUrl) {
        console.log('Image posting to Twitter not yet implemented:', imageUrl);
        // mediaId = await this.uploadImage(userClient, imageUrl);
      }

      const tweet = await userClient.v2.tweet({
        text: content,
        ...(mediaId && { media: { media_ids: [mediaId] } })
      });

      return tweet.data.id;
    } catch (error) {
      console.error('Twitter posting error:', error);
      throw new Error('Failed to post to Twitter');
    }
  }

  async refreshTokenIfNeeded(socialAccount: any): Promise<string> {
    // TODO: Implement token refresh logic
    // Check if token is expired and refresh if needed
    return socialAccount.accessToken;
  }

  // TODO: Implement image upload to Twitter
  // private async uploadImage(client: TwitterApi, imageUrl: string): Promise<string> {
  //   // Download image from URL
  //   // Upload to Twitter media endpoint
  //   // Return media ID
  // }
}

// Create instance without initializing Twitter client immediately
export const twitterService = new TwitterService();