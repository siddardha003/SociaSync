import mongoose, { Document, Schema } from 'mongoose';

export interface ISocialAccount extends Document {
  userId: mongoose.Types.ObjectId;
  platform: 'twitter' | 'linkedin' | 'instagram';
  platformUserId: string;
  username?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  isActive: boolean;
  metadata?: {
    profilePicture?: string;
    displayName?: string;
    followerCount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const socialAccountSchema = new Schema<ISocialAccount>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['twitter', 'linkedin', 'instagram'],
    required: true
  },
  platformUserId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    trim: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  expiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    profilePicture: String,
    displayName: String,
    followerCount: Number
  }
}, {
  timestamps: true
});

// Compound index to ensure one account per platform per user
socialAccountSchema.index({ userId: 1, platform: 1 }, { unique: true });

export const SocialAccount = mongoose.model<ISocialAccount>('SocialAccount', socialAccountSchema);