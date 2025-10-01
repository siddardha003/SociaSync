# SocioSync - AI-Powered Social Media Scheduler

## 🚀 Overview

SocioSync is a comprehensive social media management platform that combines AI-powered content generation with multi-platform posting capabilities. Built with Next.js, Node.js, and MongoDB, it provides a complete solution for managing your social media presence.

## ✨ Features Implemented

### 🎯 Core Features
- **Multi-Platform Support**: Twitter, LinkedIn, Instagram
- **AI Content Generation**: GPT-4 powered content creation with customizable tone and length
- **Scheduling System**: Schedule posts for optimal times using BullMQ job queue
- **Real-time Analytics**: Track performance and engagement metrics
- **Social Account Management**: OAuth integration for platform connections

### 🎨 Frontend Features (Enhanced Dashboard)
- **Modern UI/UX**: Clean, responsive design with Tailwind CSS
- **Tabbed Navigation**: Organized dashboard with dedicated sections
- **Interactive Components**: Rich forms, modals, and data visualizations
- **Real-time Updates**: Toast notifications and loading states
- **Mobile Responsive**: Optimized for all device sizes

### 🔧 Backend Features
- **RESTful API**: Comprehensive endpoints for all operations
- **Authentication**: JWT-based user authentication with bcrypt
- **Database**: MongoDB with Mongoose ODM
- **Job Queue**: BullMQ with Redis for background processing
- **Error Handling**: Comprehensive error management and logging
- **Security**: Rate limiting, CORS, Helmet security headers

## 📱 Dashboard Sections

### 1. Overview
- **Quick Stats Cards**: Posts, accounts, AI generation metrics
- **Getting Started Guide**: Step-by-step onboarding
- **Recent Activity**: Timeline of user actions
- **Quick Actions**: One-click shortcuts to common tasks

### 2. Posts Manager
- **Create/Edit Posts**: Rich text editor with character counting
- **Platform Selection**: Multi-platform targeting
- **Scheduling**: Date/time picker for future posting
- **Status Tracking**: Draft, scheduled, published, failed states
- **Bulk Actions**: Edit, delete, reschedule operations

### 3. AI Content Generator
- **Topic Input**: Describe your content idea
- **Tone Selection**: Professional, casual, humorous, inspirational, informative
- **Length Options**: Short (Twitter), medium (general), long (LinkedIn)
- **Platform Optimization**: Content tailored for specific platforms
- **Image Prompts**: AI-generated image descriptions
- **Content Variations**: Multiple content suggestions
- **One-Click Publishing**: Direct integration with post creation

### 4. Social Accounts Manager
- **Platform Cards**: Visual representation of each platform
- **Connection Status**: Real-time connection monitoring
- **Account Management**: Activate/deactivate, refresh tokens
- **OAuth Flow**: Secure platform authorization
- **Usage Analytics**: Per-platform posting statistics

### 5. Analytics Dashboard
- **Performance Metrics**: Success rates, engagement data
- **Platform Comparison**: Cross-platform performance analysis
- **Activity Timeline**: Historical posting activity
- **Visual Charts**: Bar charts, progress indicators
- **Export Options**: Data export capabilities

## 🛠 Technical Architecture

### Frontend Stack
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Modern icon library
- **React Hook Form**: Form management
- **React Hot Toast**: Notification system

### Backend Stack
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **TypeScript**: Type-safe server code
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB
- **BullMQ**: Job queue for Redis
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing

### External Services
- **OpenAI GPT-4**: Content generation
- **Twitter API v2**: Twitter integration
- **LinkedIn API**: LinkedIn integration
- **Instagram Basic Display**: Instagram integration
- **Redis**: Caching and job queue

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)
- Redis (optional, for job queue)
- API keys for social platforms and OpenAI

### Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/sociosync

# JWT
JWT_SECRET=your-secret-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# Social Media APIs
TWITTER_API_KEY=your-twitter-key
TWITTER_API_SECRET=your-twitter-secret
LINKEDIN_CLIENT_ID=your-linkedin-id
LINKEDIN_CLIENT_SECRET=your-linkedin-secret
INSTAGRAM_CLIENT_ID=your-instagram-id
INSTAGRAM_CLIENT_SECRET=your-instagram-secret

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Installation
```bash
# Clone the repository
git clone https://github.com/your-repo/sociosync.git
cd sociosync

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Start development servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Posts
- `GET /api/posts` - Get user posts
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### AI Generation
- `POST /api/ai/generate-content` - Generate AI content
- `POST /api/ai/generate-image` - Generate image prompts

### Social Accounts
- `GET /api/social/accounts` - Get connected accounts
- `GET /api/social/auth/:platform` - Start OAuth flow
- `POST /api/social/callback/:platform` - OAuth callback
- `DELETE /api/social/accounts/:id` - Disconnect account

## 🎯 Usage Examples

### Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Generate AI Content
```bash
curl -X POST http://localhost:5000/api/ai/generate-content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "topic": "productivity tips for remote workers",
    "tone": "professional",
    "length": "medium",
    "platform": "linkedin"
  }'
```

### Create a Post
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Excited to share our new productivity tips!",
    "platforms": ["twitter", "linkedin"],
    "scheduledAt": "2025-09-24T10:00:00Z"
  }'
```

## 🚀 Next Steps

### Immediate Enhancements
1. **Redis Setup**: Configure Redis for job queue functionality
2. **OAuth Integration**: Complete social media platform connections
3. **Image Upload**: Add image attachment capabilities
4. **Email Notifications**: Post success/failure notifications

### Advanced Features
1. **Team Collaboration**: Multi-user workspace support
2. **Content Calendar**: Visual scheduling interface
3. **Advanced Analytics**: Detailed engagement metrics
4. **AI Improvements**: Better content suggestions and optimization
5. **Mobile App**: React Native mobile application

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Comprehensive data validation
- **Security Headers**: Helmet.js security middleware

## 📊 Performance Optimizations

- **Lazy Loading**: Component and route-based code splitting
- **Caching**: Redis caching for frequently accessed data
- **Database Indexing**: Optimized MongoDB queries
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Analysis**: Webpack bundle optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using Next.js, Node.js, and AI**