@echo off
REM SocioSync Start Script for Windows

echo 🚀 Starting SocioSync Development Environment...

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found. Copying from .env.example...
    copy ".env.example" ".env"
    echo 📝 Please edit .env file with your API keys before continuing.
    pause
    exit /b 1
)

echo 🔧 Building and starting services with Docker Compose...

REM Start services
docker-compose up --build -d

echo ⏳ Waiting for services to start...
timeout /t 10

echo 🔍 Checking service health...

REM Check backend
curl -f http://localhost:5000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy
) else (
    echo ❌ Backend health check failed
)

REM Check frontend  
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is running
) else (
    echo ❌ Frontend check failed
)

echo.
echo 🎉 SocioSync is ready!
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:5000
echo 📊 Health Check: http://localhost:5000/api/health
echo.
echo 📋 To stop: docker-compose down
echo 📋 To view logs: docker-compose logs -f
pause