import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initializeQueue, getQueueWorker } from './services/queueService';

// Load environment variables
dotenv.config();

console.log('🚀 Starting SocioSync Worker Process...');

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sociosync')
  .then(async () => {
    console.log('✅ Worker connected to MongoDB');
    
    // Initialize Redis/Queue after DB connection
    try {
      await initializeQueue();
      const worker = getQueueWorker();
      if (worker) {
        console.log('✅ Queue worker initialized successfully');
      } else {
        console.log('⚠️  Queue worker not available (Redis not connected)');
      }
    } catch (error) {
      console.error('❌ Failed to initialize queue worker:', error);
    }
  })
  .catch((error) => {
    console.error('❌ Worker MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📊 Worker received SIGTERM, shutting down gracefully...');
  const worker = getQueueWorker();
  if (worker) {
    await worker.close();
  }
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📊 Worker received SIGINT, shutting down gracefully...');
  const worker = getQueueWorker();
  if (worker) {
    await worker.close();
  }
  await mongoose.connection.close();
  process.exit(0);
});

console.log('⚡ Worker is ready to process jobs');
console.log('📊 Environment:', process.env.NODE_ENV || 'development');
console.log('📊 Redis URL:', process.env.REDIS_URL || 'redis://localhost:6379');

// Health check for worker
setInterval(() => {
  console.log('💓 Worker heartbeat -', new Date().toISOString());
}, 60000); // Every minute