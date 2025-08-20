#!/bin/bash

# Personal Task Manager Development Script
echo "🔧 Starting Personal Task Manager in development mode..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_status ".env file created."
fi

# Check if dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    print_warning "Backend dependencies not found. Please run the setup script first:"
    print_info "bash scripts/setup.sh"
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    print_warning "Frontend dependencies not found. Please run the setup script first:"
    print_info "bash scripts/setup.sh"
    exit 1
fi

# Check if ports are available
if check_port 3001; then
    print_warning "Port 3001 (backend) is already in use. Please stop the running process or use a different port."
fi

if check_port 5173; then
    print_warning "Port 5173 (frontend) is already in use. Please stop the running process or use a different port."
fi

# Create log directory
mkdir -p logs

print_status "Starting development servers..."

# Function to cleanup background processes
cleanup() {
    print_info "Stopping development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap SIGINT and SIGTERM to cleanup
trap cleanup SIGINT SIGTERM

# Start backend server
print_info "Starting backend server on port 3001..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
print_info "Starting frontend server on port 5173..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 3

echo ""
print_status "Development servers started successfully!"
echo ""
print_info "🌐 Frontend: http://localhost:5173"
print_info "🔧 Backend API: http://localhost:3001"
print_info "🗄️  Database Studio: cd backend && npm run db:studio"
echo ""
print_info "📚 Demo credentials:"
print_info "   Email: demo@example.com"
print_info "   Password: demo123"
echo ""
print_info "📝 Logs are available in:"
print_info "   Backend: logs/backend.log"
print_info "   Frontend: logs/frontend.log"
echo ""
print_info "Press Ctrl+C to stop all servers"

# Keep script running and monitor processes
while true; do
    # Check if backend is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "Backend server stopped unexpectedly. Check logs/backend.log"
        cleanup
    fi
    
    # Check if frontend is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "Frontend server stopped unexpectedly. Check logs/frontend.log"
        cleanup
    fi
    
    sleep 5
done