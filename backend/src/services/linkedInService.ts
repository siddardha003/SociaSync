import axios from 'axios';
import { SocialAccount } from '../models/SocialAccount';

export class LinkedInService {
  private readonly baseUrl = 'https://api.linkedin.com/v2';

  async getAuthUrl(userId: string): Promise<string> {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${process.env.FRONTEND_URL}/auth/linkedin/callback`;
    const state = JSON.stringify({ userId, platform: 'linkedin' });
    const scope = 'r_liteprofile r_emailaddress w_member_social';

    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;
  }

  async handleCallback(code: string, state: string): Promise<void> {
    const stateData = JSON.parse(state);
    const { userId } = stateData;

    try {
      // Exchange code for access token
      const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.FRONTEND_URL}/auth/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      });

      const { access_token } = tokenResponse.data;

      // Get user profile
      const profileResponse = await axios.get(`${this.baseUrl}/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))`, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      const profile = profileResponse.data;

      // Save or update social account
      await SocialAccount.findOneAndUpdate(
        { userId, platform: 'linkedin' },
        {
          platformUserId: profile.id,
          accessToken: access_token,
          isActive: true,
          metadata: {
            displayName: `${profile.firstName.localized.en_US} ${profile.lastName.localized.en_US}`,
            profilePicture: profile.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier
          }
        },
        { upsert: true, new: true }
      );

    } catch (error) {
      console.error('LinkedIn OAuth callback error:', error);
      throw new Error('Failed to connect LinkedIn account');
    }
  }

  async postToLinkedIn(content: string, imageUrl?: string, accessToken?: string): Promise<string> {
    if (!accessToken) {
      throw new Error('LinkedIn access token required');
    }

    try {
      // Get user ID first
      const profileResponse = await axios.get(`${this.baseUrl}/people/~:(id)`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const userId = profileResponse.data.id;

      // TODO: Implement image posting to LinkedIn
      // This requires uploading image to LinkedIn's media API first
      if (imageUrl) {
        console.log('Image posting to LinkedIn not yet implemented:', imageUrl);
      }

      // Create post
      const postData = {
        author: `urn:li:person:${userId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await axios.post(`${this.baseUrl}/ugcPosts`, postData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
      });

      // Extract post ID from the response
      const postId = response.data.id || response.headers['x-linkedin-id'];
      return postId;

    } catch (error) {
      console.error('LinkedIn posting error:', error);
      throw new Error('Failed to post to LinkedIn');
    }
  }

  // TODO: Implement image upload to LinkedIn
  // async uploadImage(accessToken: string, imageUrl: string): Promise<string> {
  //   // 1. Register upload
  //   // 2. Upload image binary
  //   // 3. Return asset URN
  // }
}

export const linkedInService = new LinkedInService();