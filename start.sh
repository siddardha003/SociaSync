#!/bin/bash

# SocioSync Start Script
echo "🚀 Starting SocioSync Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your API keys before continuing."
    exit 1
fi

echo "🔧 Building and starting services with Docker Compose..."

# Start services
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check backend
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend check failed"
fi

echo ""
echo "🎉 SocioSync is ready!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📊 Health Check: http://localhost:5000/api/health"
echo ""
echo "📋 To stop: docker-compose down"
echo "📋 To view logs: docker-compose logs -f"