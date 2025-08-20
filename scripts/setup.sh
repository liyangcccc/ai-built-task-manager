#!/bin/bash

# Personal Task Manager Setup Script
echo "🚀 Setting up Personal Task Manager..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js (v16 or higher) and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_status "npm version: $(npm -v)"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_status ".env file created. Please update it with your configuration."
else
    print_status ".env file already exists."
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
if npm install; then
    print_status "Backend dependencies installed successfully."
else
    print_error "Failed to install backend dependencies."
    exit 1
fi

# Generate Prisma client
echo ""
echo "🔧 Setting up database..."
if npm run db:generate; then
    print_status "Prisma client generated successfully."
else
    print_error "Failed to generate Prisma client."
    exit 1
fi

# Run database migrations
if npm run db:migrate; then
    print_status "Database migrations completed successfully."
else
    print_error "Failed to run database migrations."
    exit 1
fi

# Seed the database
if npm run db:seed; then
    print_status "Database seeded successfully."
else
    print_warning "Failed to seed database. You can run 'npm run db:seed' manually later."
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
if npm install; then
    print_status "Frontend dependencies installed successfully."
else
    print_error "Failed to install frontend dependencies."
    exit 1
fi

# Go back to root directory
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Update the .env file with your configuration"
echo "   2. Start the backend: cd backend && npm run dev"
echo "   3. Start the frontend: cd frontend && npm run dev"
echo "   4. Open http://localhost:5173 in your browser"
echo ""
echo "📚 Demo credentials:"
echo "   Email: demo@example.com"
echo "   Password: demo123"
echo ""
echo "🔧 Useful commands:"
echo "   - Backend dev server: cd backend && npm run dev"
echo "   - Frontend dev server: cd frontend && npm run dev"
echo "   - Database studio: cd backend && npm run db:studio"
echo "   - Run tests: npm test (in respective directories)"
echo ""