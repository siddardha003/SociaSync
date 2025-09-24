import { TwitterApi } from 'twitter-api-v2';

export interface PublishRequest {
  content: string;
  imageUrl?: string;
  accessToken: string;
  refreshToken?: string;
}

export interface PublishResponse {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

export interface OAuthUrls {
  authUrl: string;
  state: string;
}

export class SocialMediaService {
  // Twitter integration
  async publishToTwitter(request: PublishRequest): Promise<PublishResponse> {
    try {
      const twitterClient = new TwitterApi(request.accessToken);
      
      let mediaId: string | undefined;
      
      // Upload image if provided
      if (request.imageUrl) {
        try {
          // TODO: Download image and upload to Twitter
          // For MVP, we'll skip image upload to Twitter
          console.log('Twitter image upload not implemented in MVP');
        } catch (imageError) {
          console.error('Twitter image upload failed:', imageError);
          // Continue without image
        }
      }

      // Create tweet
      const tweet = await twitterClient.v2.tweet({
        text: request.content,
        ...(mediaId && { media: { media_ids: [mediaId] } })
      });

      return {
        success: true,
        postId: tweet.data.id,
        url: `https://twitter.com/i/status/${tweet.data.id}`
      };

    } catch (error) {
      console.error('Twitter publish error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Twitter error'
      };
    }
  }

  async getTwitterOAuthUrl(callbackUrl: string): Promise<OAuthUrls> {
    try {
      const client = new TwitterApi({
        appKey: process.env.TWITTER_CLIENT_ID!,
        appSecret: process.env.TWITTER_CLIENT_SECRET!,
      });

      const { url, oauth_token, oauth_token_secret } = await client.generateAuthLink(callbackUrl);
      
      // Store oauth_token_secret temporarily (in production, use Redis or database)
      // For MVP, we'll return it in state (not recommended for production)
      const state = Buffer.from(JSON.stringify({ 
        oauth_token_secret,
        platform: 'twitter'
      })).toString('base64');

      return {
        authUrl: url,
        state
      };

    } catch (error) {
      console.error('Twitter OAuth URL generation failed:', error);
      throw new Error('Failed to generate Twitter OAuth URL');
    }
  }

  async handleTwitterCallback(oauth_token: string, oauth_verifier: string, oauth_token_secret: string) {
    try {
      const client = new TwitterApi({
        appKey: process.env.TWITTER_CLIENT_ID!,
        appSecret: process.env.TWITTER_CLIENT_SECRET!,
        accessToken: oauth_token,
        accessSecret: oauth_token_secret,
      });

      const { accessToken, accessSecret, screenName, userId } = await client.login(oauth_verifier);
      
      return {
        accessToken,
        accessSecret,
        username: screenName,
        platformUserId: userId
      };

    } catch (error) {
      console.error('Twitter OAuth callback failed:', error);
      throw new Error('Failed to complete Twitter OAuth');
    }
  }

  // LinkedIn integration (stub for MVP)
  async publishToLinkedIn(request: PublishRequest): Promise<PublishResponse> {
    try {
      // TODO: Implement LinkedIn API integration
      console.log('LinkedIn integration - MVP stub');
      console.log('Content to publish:', request.content);
      
      // For MVP, return success simulation
      return {
        success: true,
        postId: `linkedin_${Date.now()}`,
        url: 'https://linkedin.com/posts/example'
      };

    } catch (error) {
      console.error('LinkedIn publish error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown LinkedIn error'
      };
    }
  }

  async getLinkedInOAuthUrl(callbackUrl: string): Promise<OAuthUrls> {
    // TODO: Implement LinkedIn OAuth flow
    const clientId = process.env.LINKEDIN_CLIENT_ID!;
    const scope = 'r_liteprofile r_emailaddress w_member_social';
    const state = Buffer.from(JSON.stringify({ 
      platform: 'linkedin',
      timestamp: Date.now()
    })).toString('base64');

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `state=${state}&` +
      `scope=${encodeURIComponent(scope)}`;

    return {
      authUrl,
      state
    };
  }

  async handleLinkedInCallback(code: string, callbackUrl: string) {
    try {
      // TODO: Exchange code for access token
      console.log('LinkedIn OAuth callback - MVP stub');
      
      // For MVP, return mock data
      return {
        accessToken: `linkedin_token_${Date.now()}`,
        refreshToken: `linkedin_refresh_${Date.now()}`,
        username: 'mock_linkedin_user',
        platformUserId: `linkedin_${Date.now()}`
      };

    } catch (error) {
      console.error('LinkedIn OAuth callback failed:', error);
      throw new Error('Failed to complete LinkedIn OAuth');
    }
  }

  // Instagram integration (stub for MVP)
  async publishToInstagram(request: PublishRequest): Promise<PublishResponse> {
    try {
      // TODO: Implement Instagram Graph API integration
      console.log('Instagram integration - MVP stub');
      console.log('Content to publish:', request.content);
      
      // For MVP, return success simulation
      return {
        success: true,
        postId: `instagram_${Date.now()}`,
        url: 'https://instagram.com/p/example'
      };

    } catch (error) {
      console.error('Instagram publish error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Instagram error'
      };
    }
  }

  async getInstagramOAuthUrl(callbackUrl: string): Promise<OAuthUrls> {
    // TODO: Implement Instagram OAuth flow
    const clientId = process.env.INSTAGRAM_APP_ID!;
    const scope = 'instagram_basic,instagram_content_publish';
    const state = Buffer.from(JSON.stringify({ 
      platform: 'instagram',
      timestamp: Date.now()
    })).toString('base64');

    const authUrl = `https://api.instagram.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `scope=${scope}&` +
      `response_type=code&` +
      `state=${state}`;

    return {
      authUrl,
      state
    };
  }

  async handleInstagramCallback(code: string, callbackUrl: string) {
    try {
      // TODO: Exchange code for access token
      console.log('Instagram OAuth callback - MVP stub');
      
      // For MVP, return mock data
      return {
        accessToken: `instagram_token_${Date.now()}`,
        refreshToken: `instagram_refresh_${Date.now()}`,
        username: 'mock_instagram_user',
        platformUserId: `instagram_${Date.now()}`
      };

    } catch (error) {
      console.error('Instagram OAuth callback failed:', error);
      throw new Error('Failed to complete Instagram OAuth');
    }
  }

  // Main publish method that routes to appropriate platform
  async publishPost(platform: string, request: PublishRequest): Promise<PublishResponse> {
    switch (platform) {
      case 'twitter':
        return this.publishToTwitter(request);
      case 'linkedin':
        return this.publishToLinkedIn(request);
      case 'instagram':
        return this.publishToInstagram(request);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  // Get OAuth URL for any platform
  async getOAuthUrl(platform: string, callbackUrl: string): Promise<OAuthUrls> {
    switch (platform) {
      case 'twitter':
        return this.getTwitterOAuthUrl(callbackUrl);
      case 'linkedin':
        return this.getLinkedInOAuthUrl(callbackUrl);
      case 'instagram':
        return this.getInstagramOAuthUrl(callbackUrl);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  // Handle OAuth callback for any platform
  async handleOAuthCallback(platform: string, params: any, callbackUrl: string) {
    switch (platform) {
      case 'twitter':
        return this.handleTwitterCallback(
          params.oauth_token,
          params.oauth_verifier,
          params.oauth_token_secret
        );
      case 'linkedin':
        return this.handleLinkedInCallback(params.code, callbackUrl);
      case 'instagram':
        return this.handleInstagramCallback(params.code, callbackUrl);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}

export const socialMediaService = new SocialMediaService();