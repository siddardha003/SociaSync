import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface SocialProvider {
  platform: 'twitter' | 'linkedin' | 'instagram';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  userId: string;
  platformUserId: string;
  username?: string;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  scheduledAt?: Date;
  publishedAt?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  platforms: ('twitter' | 'linkedin' | 'instagram')[];
  metadata?: {
    aiGenerated?: boolean;
    prompt?: string;
    variations?: string[];
  };
}

export interface AIGenerationRequest {
  prompt: string;
  type: 'caption' | 'image' | 'both';
  platform?: 'twitter' | 'linkedin' | 'instagram';
  tone?: 'professional' | 'casual' | 'funny' | 'inspirational';
  length?: 'short' | 'medium' | 'long';
}

export interface AIGenerationResponse {
  captions?: string[];
  imagePrompt?: string;
  imageUrl?: string;
}

export interface JobData {
  postId: string;
  userId: string;
  platforms: string[];
  content: string;
  imageUrl?: string;
}

export interface OAuthState {
  userId: string;
  platform: string;
  returnUrl?: string;
}