# SocioSync - AI-Powered Social Media Scheduler

A full-stack MVP application for scheduling social media posts with AI-generated content across Twitter, LinkedIn, and Instagram.

## 🚀 Features

- **AI Content Generation**: Create engaging captions and images using OpenAI GPT-4 and DALL-E
- **Multi-Platform Publishing**: Support for Twitter, LinkedIn, and Instagram
- **Smart Scheduling**: Queue-based job system with BullMQ and Redis
- **OAuth Integration**: Secure social media account connections
- **Real-time Dashboard**: Modern React interface with Tailwind CSS
- **Secure Backend**: JWT authentication, rate limiting, and encrypted storage

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** with TypeScript
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **React Hot Toast** for notifications
- **Lucide React** for icons

### Backend
- **Node.js** with **Express** and TypeScript
- **MongoDB** with Mongoose ODM
- **Redis** for caching and job queue
- **BullMQ** for background job processing
- **JWT** for authentication
- **OpenAI API** for content generation
- **Twitter API v2** for posting

### Infrastructure
- **Docker Compose** for local development
- **Helmet** for security headers
- **CORS** protection
- **Rate limiting** middleware

## 📋 Prerequisites

- **Node.js** 18+ 
- **Docker** and **Docker Compose**
- **OpenAI API Key**
- **Twitter Developer Account** (for OAuth)
- **LinkedIn Developer Account** (optional)
- **Instagram Business Account** (optional)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd SocioSync

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
```

### 2. Configure Environment Variables

Edit `.env` and `backend/.env` with your API keys:

```env
# .env (root)
OPENAI_API_KEY=your-openai-api-key
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
# ... other social media credentials
```

### 3. Start with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

### 4. Manual Setup (Alternative)

```bash
# Install backend dependencies
cd backend
npm install
npm run build

# Install frontend dependencies
cd ../frontend
npm install

# Start MongoDB and Redis locally
# Then start the services:

# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Worker
cd backend
npm run worker

# Terminal 3 - Frontend
cd frontend
npm run dev
```

## 🔧 Configuration

### Social Media OAuth Setup

#### Twitter Setup
1. Create a Twitter Developer App at https://developer.twitter.com
2. Generate API keys and Bearer token
3. Set callback URL: `http://localhost:5000/api/social/callback/twitter`
4. Add credentials to `.env`

#### LinkedIn Setup (MVP Stub)
1. Create LinkedIn App at https://developer.linkedin.com
2. Request r_liteprofile, r_emailaddress, w_member_social permissions
3. Set redirect URI: `http://localhost:5000/api/social/callback/linkedin`
4. Add credentials to `.env`

#### Instagram Setup (MVP Stub)
1. Create Facebook/Meta App at https://developers.facebook.com
2. Add Instagram Basic Display product
3. Set redirect URI: `http://localhost:5000/api/social/callback/instagram`
4. Add credentials to `.env`

### OpenAI Configuration
1. Get API key from https://platform.openai.com
2. Add to `OPENAI_API_KEY` in environment files
3. Ensure billing is set up for GPT-4 and DALL-E access

## 📝 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
PUT  /api/auth/me
POST /api/auth/logout
```

### AI Content Generation

```http
POST /api/ai/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "prompt": "A motivational post about productivity",
  "type": "both",
  "platform": "twitter",
  "tone": "professional",
  "length": "medium"
}
```

### Posts Management

```http
GET    /api/posts                 # List posts
POST   /api/posts                 # Create post
PUT    /api/posts/:id             # Update post
DELETE /api/posts/:id             # Delete post
POST   /api/posts/:id/schedule    # Schedule post
POST   /api/posts/:id/publish     # Publish now
```

### Social Media Integration

```http
GET    /api/social/accounts        # Connected accounts
POST   /api/social/connect/:platform
DELETE /api/social/accounts/:platform
```

## 🧪 Manual Testing

### 1. User Registration & Login
```bash
# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. AI Content Generation
```bash
# Generate content (replace TOKEN with actual JWT)
curl -X POST http://localhost:5000/api/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"prompt":"Tips for remote work","type":"caption","platform":"twitter"}'
```

### 3. Create and Schedule Post
```bash
# Create post
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"content":"Hello world!","platforms":["twitter"]}'

# Schedule post (replace POST_ID)
curl -X POST http://localhost:5000/api/posts/POST_ID/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"scheduledAt":"2025-09-24T10:00:00Z"}'
```

## 🔍 Health Checks

- **API Health**: http://localhost:5000/api/health
- **AI Service**: http://localhost:5000/api/ai/health
- **Frontend**: http://localhost:3000

## 📊 Monitoring

### Queue Dashboard
Access BullMQ dashboard (if configured):
```bash
npm install -g bull-board
bull-board
```

### Database
```bash
# MongoDB shell
docker exec -it sociosync_mongodb mongosh --username admin --password password123

# Redis CLI
docker exec -it sociosync_redis redis-cli -a redis123
```

## 🚀 Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
JWT_SECRET=generate-strong-secret-key
MONGODB_URI=mongodb://your-production-db
REDIS_URL=redis://your-production-redis
OPENAI_API_KEY=your-production-openai-key
```

### Security Checklist
- [ ] Change default database passwords
- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable MongoDB authentication
- [ ] Secure Redis with password
- [ ] Validate all environment variables

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check if MongoDB is running
docker-compose logs mongodb

# Reset MongoDB data
docker-compose down -v
docker-compose up -d
```

**Redis Connection Failed**
```bash
# Check Redis status
docker-compose logs redis

# Test Redis connection
docker exec -it sociosync_redis redis-cli ping
```

**OpenAI API Errors**
- Verify API key is correct
- Check billing and usage limits
- Ensure GPT-4 access is enabled

**Twitter OAuth Issues**
- Verify callback URL matches exactly
- Check app permissions
- Ensure app is not in restricted mode

### Support

For issues and questions:
1. Check the troubleshooting section
2. Review Docker logs: `docker-compose logs`
3. Open an issue on GitHub

---

**Built with ❤️ for social media creators and businesses**