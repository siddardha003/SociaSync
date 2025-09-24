import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  imageUrl?: string;
  imagePrompt?: string;
  scheduledAt?: Date;
  publishedAt?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  platforms: ('twitter' | 'linkedin' | 'instagram')[];
  publishResults?: {
    platform: string;
    success: boolean;
    publishedId?: string;
    error?: string;
    publishedAt?: Date;
  }[];
  metadata?: {
    aiGenerated?: boolean;
    originalPrompt?: string;
    variations?: string[];
    tone?: string;
    length?: string;
  };
  jobId?: string; // BullMQ job ID for scheduled posts
  retryCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  imageUrl: {
    type: String,
    validate: {
      validator: function(v: string) {
        if (!v) return true;
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },
  imagePrompt: {
    type: String,
    maxlength: 500
  },
  scheduledAt: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        if (!v) return true;
        return v > new Date();
      },
      message: 'Scheduled time must be in the future'
    }
  },
  publishedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft',
    index: true
  },
  platforms: [{
    type: String,
    enum: ['twitter', 'linkedin', 'instagram']
  }],
  publishResults: [{
    platform: {
      type: String,
      enum: ['twitter', 'linkedin', 'instagram']
    },
    success: Boolean,
    publishedId: String,
    error: String,
    publishedAt: Date
  }],
  metadata: {
    aiGenerated: {
      type: Boolean,
      default: false
    },
    originalPrompt: String,
    variations: [String],
    tone: {
      type: String,
      enum: ['professional', 'casual', 'funny', 'inspirational']
    },
    length: {
      type: String,
      enum: ['short', 'medium', 'long']
    }
  },
  jobId: String,
  retryCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for scheduled posts
postSchema.index({ status: 1, scheduledAt: 1 });

export const Post = mongoose.model<IPost>('Post', postSchema);