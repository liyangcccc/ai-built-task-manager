#!/bin/bash

# Personal Task Manager Build Script
echo "🔨 Building Personal Task Manager..."

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

# Create build directory
mkdir -p build

# Build backend
echo ""
echo "🔧 Preparing backend for production..."
cd backend

# Install production dependencies
if npm ci --only=production; then
    print_status "Backend production dependencies installed."
else
    print_error "Failed to install backend production dependencies."
    exit 1
fi

# Generate Prisma client for production
if npm run db:generate; then
    print_status "Prisma client generated for production."
else
    print_error "Failed to generate Prisma client."
    exit 1
fi

# Copy backend files to build directory
cp -r src ../build/backend-src
cp package.json ../build/backend-package.json
cp -r prisma ../build/prisma
cp -r node_modules ../build/backend-node_modules

print_status "Backend prepared for production."

# Build frontend
echo ""
echo "🔧 Building frontend for production..."
cd ../frontend

# Install dependencies
if npm ci; then
    print_status "Frontend dependencies installed."
else
    print_error "Failed to install frontend dependencies."
    exit 1
fi

# Build frontend
if npm run build; then
    print_status "Frontend built successfully."
else
    print_error "Frontend build failed."
    exit 1
fi

# Copy frontend build to build directory
cp -r dist ../build/frontend-dist

print_status "Frontend build completed."

# Create production scripts
cd ..
echo ""
echo "📝 Creating production scripts..."

# Create production start script
cat > build/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Personal Task Manager in production mode..."

# Set production environment
export NODE_ENV=production

# Start backend server
cd backend-src && node index.js
EOF

# Create production package.json
cat > build/package.json << 'EOF'
{
  "name": "personal-task-manager-production",
  "version": "1.0.0",
  "description": "Personal Task Manager - Production Build",
  "main": "backend-src/index.js",
  "scripts": {
    "start": "node backend-src/index.js",
    "migrate": "cd prisma && npx prisma migrate deploy"
  },
  "keywords": ["task-manager", "production"],
  "license": "ISC"
}
EOF

# Make start script executable
chmod +x build/start.sh

print_status "Production scripts created."

# Create deployment instructions
cat > build/DEPLOYMENT.md << 'EOF'
# Deployment Instructions

## Production Build Contents

- `backend-src/` - Backend application code
- `frontend-dist/` - Built frontend application
- `prisma/` - Database schema and migrations
- `package.json` - Production package configuration
- `start.sh` - Production start script

## Deployment Steps

1. **Copy build files to production server:**
   ```bash
   scp -r build/* user@your-server:/path/to/app/
   ```

2. **On the production server:**
   ```bash
   cd /path/to/app/
   npm install --only=production
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

4. **Run database migrations:**
   ```bash
   npm run migrate
   ```

5. **Start the application:**
   ```bash
   ./start.sh
   ```

## Environment Variables for Production

- `NODE_ENV=production`
- `DATABASE_URL` - Production database URL
- `JWT_SECRET` - Strong secret for JWT tokens
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend domain for CORS

## Serving Frontend

The frontend build is in `frontend-dist/`. Serve it using:
- Nginx
- Apache
- Express static middleware
- CDN (recommended)

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/app/frontend-dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Process Management

Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start backend-src/index.js --name "task-manager"
pm2 startup
pm2 save
```
EOF

print_status "Deployment instructions created."

echo ""
echo "🎉 Build completed successfully!"
echo ""
echo "📁 Build output is in the 'build/' directory"
echo "📚 See build/DEPLOYMENT.md for deployment instructions"
echo ""
echo "🔧 Production build includes:"
echo "   - Optimized backend code"
echo "   - Minified frontend assets"
echo "   - Production dependencies only"
echo "   - Deployment scripts and documentation"
echo ""