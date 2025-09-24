// MongoDB initialization script
// This script sets up the initial database and collections

db = db.getSiblingDB('posty_bot');

// Create collections with indexes
db.createCollection('users');
db.users.createIndex({ "email": 1 }, { unique: true });

db.createCollection('posts');
db.posts.createIndex({ "userId": 1 });
db.posts.createIndex({ "status": 1, "scheduledAt": 1 });

db.createCollection('socialaccounts');
db.socialaccounts.createIndex({ "userId": 1, "platform": 1 }, { unique: true });

print('✅ PostyBot database initialized successfully');