import axios from 'axios';
import { SocialAccount } from '../models/SocialAccount';

export class InstagramService {
  private readonly baseUrl = 'https://graph.instagram.com';

  async getAuthUrl(userId: string): Promise<string> {
    const clientId = process.env.INSTAGRAM_APP_ID;
    const redirectUri = `${process.env.FRONTEND_URL}/auth/instagram/callback`;
    const state = JSON.stringify({ userId, platform: 'instagram' });
    const scope = 'instagram_basic,instagram_content_publish';

    return `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${encodeURIComponent(state)}`;
  }

  async handleCallback(code: string, state: string): Promise<void> {
    const stateData = JSON.parse(state);
    const { userId } = stateData;

    try {
      // Exchange code for short-lived access token
      const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.FRONTEND_URL}/auth/instagram/callback`,
        code,
      });

      const { access_token, user_id } = tokenResponse.data;

      // Exchange for long-lived access token
      const longLivedTokenResponse = await axios.get(`${this.baseUrl}/access_token`, {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: process.env.INSTAGRAM_APP_SECRET,
          access_token,
        },
      });

      const longLivedToken = longLivedTokenResponse.data.access_token;

      // Get user info
      const userResponse = await axios.get(`${this.baseUrl}/me`, {
        params: {
          fields: 'id,username',
          access_token: longLivedToken,
        },
      });

      const userInfo = userResponse.data;

      // Save or update social account
      await SocialAccount.findOneAndUpdate(
        { userId, platform: 'instagram' },
        {
          platformUserId: userInfo.id,
          username: userInfo.username,
          accessToken: longLivedToken,
          isActive: true,
          metadata: {
            displayName: userInfo.username
          }
        },
        { upsert: true, new: true }
      );

    } catch (error) {
      console.error('Instagram OAuth callback error:', error);
      throw new Error('Failed to connect Instagram account');
    }
  }

  async postToInstagram(content: string, imageUrl: string, accessToken?: string): Promise<string> {
    if (!accessToken) {
      throw new Error('Instagram access token required');
    }

    if (!imageUrl) {
      throw new Error('Instagram posts require an image');
    }

    try {
      // Get user Instagram Business Account ID
      const userResponse = await axios.get(`${this.baseUrl}/me`, {
        params: {
          fields: 'id',
          access_token: accessToken,
        },
      });

      const instagramAccountId = userResponse.data.id;

      // Create media container
      const mediaResponse = await axios.post(`${this.baseUrl}/${instagramAccountId}/media`, {
        image_url: imageUrl,
        caption: content,
        access_token: accessToken,
      });

      const creationId = mediaResponse.data.id;

      // Publish the media
      const publishResponse = await axios.post(`${this.baseUrl}/${instagramAccountId}/media_publish`, {
        creation_id: creationId,
        access_token: accessToken,
      });

      return publishResponse.data.id;

    } catch (error) {
      console.error('Instagram posting error:', error);
      throw new Error('Failed to post to Instagram');
    }
  }

  async refreshTokenIfNeeded(socialAccount: any): Promise<string> {
    // TODO: Implement token refresh logic for Instagram long-lived tokens
    // Instagram long-lived tokens are valid for 60 days and can be refreshed
    return socialAccount.accessToken;
  }
}

export const instagramService = new InstagramService();