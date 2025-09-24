import { Queue, Worker, Job } from 'bullmq';
import Redis from 'redis';
import { Post } from '../models/Post';
import { SocialAccount } from '../models/SocialAccount';
import { socialMediaService } from './socialMediaService';
import { JobData } from '../types';

// Redis connection config
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

// Lazy initialization for Redis client
let redisClient: Redis.RedisClientType | null = null;
let postQueue: Queue | null = null;
let worker: Worker | null = null;
let isRedisEnabled = false;

// Get Redis client with lazy initialization
export const getRedisClient = async () => {
  if (!redisClient) {
    try {
      redisClient = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        isRedisEnabled = false;
      });

      redisClient.on('connect', () => {
        console.log('✅ Connected to Redis');
        isRedisEnabled = true;
      });

      await redisClient.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      isRedisEnabled = false;
      throw error;
    }
  }
  return redisClient;
};

// Get post queue with lazy initialization
export const getPostQueue = () => {
  if (!postQueue) {
    try {
      postQueue = new Queue('post-publishing', {
        connection: redisConnection,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      });
      isRedisEnabled = true;
    } catch (error) {
      console.error('Failed to create post queue:', error);
      isRedisEnabled = false;
      throw error;
    }
  }
  return postQueue;
};

// Initialize Redis connection
export const initializeRedis = async () => {
  try {
    await getRedisClient();
    getPostQueue();
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    isRedisEnabled = false;
    // Don't throw error - let the server continue without Redis
  }
};

export class JobQueueService {
  async schedulePost(postId: string, scheduledAt: Date): Promise<string> {
    try {
      if (!isRedisEnabled) {
        throw new Error('Redis is not available for job scheduling');
      }

      const queue = getPostQueue();
      const delay = scheduledAt.getTime() - Date.now();
      
      if (delay <= 0) {
        throw new Error('Cannot schedule post in the past');
      }

      const job = await queue.add(
        'publish-post',
        { postId },
        {
          delay,
          jobId: postId, // Use postId as jobId for easy lookup
        }
      );

      console.log(`📅 Scheduled post ${postId} for ${scheduledAt}`);
      return job.id!;
    } catch (error) {
      console.error('Failed to schedule post:', error);
      throw error;
    }
  }

  async cancelScheduledPost(jobId: string): Promise<boolean> {
    try {
      if (!isRedisEnabled) {
        console.warn('Redis is not available - cannot cancel scheduled post');
        return false;
      }

      const queue = getPostQueue();
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
        console.log(`❌ Cancelled scheduled post job ${jobId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to cancel scheduled post:', error);
      throw error;
    }
  }

  async reschedulePost(jobId: string, newScheduledAt: Date): Promise<string> {
    try {
      // Cancel existing job
      await this.cancelScheduledPost(jobId);
      
      // Schedule new job
      return await this.schedulePost(jobId, newScheduledAt);
    } catch (error) {
      console.error('Failed to reschedule post:', error);
      throw error;
    }
  }

  async getJobStatus(jobId: string): Promise<any> {
    try {
      if (!isRedisEnabled) {
        return null;
      }

      const queue = getPostQueue();
      const job = await queue.getJob(jobId);
      if (!job) return null;

      return {
        id: job.id,
        data: job.data,
        state: await job.getState(),
        progress: job.progress,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
      };
    } catch (error) {
      console.error('Failed to get job status:', error);
      return null;
    }
  }

  async getQueueStats(): Promise<any> {
    try {
      if (!isRedisEnabled) {
        return {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
        };
      }

      const queue = getPostQueue();
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
        delayed: delayed.length,
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return null;
    }
  }
}

export const jobQueueService = new JobQueueService();

// Worker to process scheduled posts
export const createPostWorker = () => {
  if (!isRedisEnabled) {
    console.warn('Redis is not available - cannot create post worker');
    return null;
  }

  try {
    worker = new Worker(
      'post-publishing',
      async (job: Job<{ postId: string }>) => {
      const { postId } = job.data;
      
      try {
        console.log(`🚀 Processing post publication: ${postId}`);
        
        // Update job progress
        await job.updateProgress(10);

        // Get post details
        const post = await Post.findById(postId).populate('userId');
        if (!post) {
          throw new Error(`Post ${postId} not found`);
        }

        if (post.status !== 'scheduled') {
          console.log(`Post ${postId} is not scheduled (status: ${post.status})`);
          return { success: false, reason: 'Post not in scheduled status' };
        }

        await job.updateProgress(25);

        // Get user's connected social accounts
        const socialAccounts = await SocialAccount.find({
          userId: post.userId,
          platform: { $in: post.platforms },
          isActive: true
        });

        if (socialAccounts.length === 0) {
          throw new Error('No active social accounts found for specified platforms');
        }

        await job.updateProgress(50);

        const publishResults = [];
        let hasSuccess = false;

        // Publish to each platform
        for (const account of socialAccounts) {
          try {
            console.log(`📤 Publishing to ${account.platform} for user ${account.username}`);
            
            const result = await socialMediaService.publishPost(
              account.platform,
              {
                content: post.content,
                imageUrl: post.imageUrl,
                accessToken: account.accessToken,
                refreshToken: account.refreshToken,
              }
            );

            publishResults.push({
              platform: account.platform,
              success: true,
              publishedId: result.postId,
              publishedAt: new Date(),
            });

            hasSuccess = true;
            console.log(`✅ Successfully published to ${account.platform}: ${result.postId}`);
            
          } catch (platformError) {
            console.error(`❌ Failed to publish to ${account.platform}:`, platformError);
            
            publishResults.push({
              platform: account.platform,
              success: false,
              error: platformError instanceof Error ? platformError.message : 'Unknown error',
              publishedAt: new Date(),
            });
          }
        }

        await job.updateProgress(75);

        // Update post status
        const newStatus = hasSuccess ? 'published' : 'failed';
        await Post.findByIdAndUpdate(postId, {
          status: newStatus,
          publishedAt: hasSuccess ? new Date() : undefined,
          publishResults,
          $inc: { retryCount: 1 }
        });

        await job.updateProgress(100);

        console.log(`📊 Post ${postId} publication complete. Status: ${newStatus}`);
        
        return {
          success: hasSuccess,
          publishResults,
          status: newStatus
        };

      } catch (error) {
        console.error(`❌ Failed to process post ${postId}:`, error);
        
        // Update post status to failed
        await Post.findByIdAndUpdate(postId, {
          status: 'failed',
          $inc: { retryCount: 1 }
        });

        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process up to 5 jobs concurrently
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  return worker;
  } catch (error) {
    console.error('Failed to create post worker:', error);
    return null;
  }
};