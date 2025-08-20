# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a full-stack task management application with the following structure:

- **Frontend**: React 18 + TypeScript using Vite, located in `frontend/`
- **Backend**: Node.js + Express API using Prisma ORM, located in `backend/`
- **Database**: SQLite with Prisma for migrations and client generation
- **Authentication**: JWT-based auth with auto-login demo functionality

### Key Patterns

- **Monorepo Structure**: Frontend and backend are separate directories with their own package.json files
- **API Design**: RESTful API with consistent response format `{ success: boolean, data: T, error?: string }`
- **Authentication**: JWT tokens with automatic retry and demo user fallback in frontend
- **Database Relations**: User -> Tasks -> Categories with proper foreign key constraints
- **Type Safety**: Shared TypeScript interfaces between frontend and backend for API contracts

## Essential Commands

### Setup & Development
```bash
# Initial setup (from root)
npm run setup              # Run setup script (installs deps, sets up DB)
npm run dev               # Start both frontend and backend in development

# Manual setup
npm run install:all       # Install all dependencies
cd backend && npm run db:migrate && npm run db:seed  # Setup database
```

### Development Servers
```bash
# Backend (port 3001)
cd backend && npm run dev

# Frontend (port 5173) 
cd frontend && npm run dev

# Database management
cd backend && npm run db:studio    # Open Prisma Studio
cd backend && npm run db:generate  # Regenerate Prisma client
```

### Testing & Quality
```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# Frontend linting
cd frontend && npm run lint
cd frontend && npm run lint:fix
```

### Build & Production
```bash
npm run build            # Production build (see scripts/build.sh)
cd frontend && npm run build        # Frontend build only
cd frontend && npm run electron-pack # Electron app build
```

## Database Schema

Core entities:
- **Users**: Authentication with email/password, JWT tokens
- **Tasks**: Title, description, priority (LOW/MEDIUM/HIGH/URGENT), due dates, completion status
- **Categories**: Color-coded task organization

Database operations use Prisma Client with proper user isolation (all queries filtered by userId).

## API Endpoints

All API routes are prefixed with `/api` and require authentication except health check:

- `GET /health` - Health check (public)
- `POST /api/auth/register` - User registration  
- `POST /api/auth/login` - User login
- `GET|POST|PUT|DELETE /api/tasks` - Task CRUD operations
- `GET /api/categories` - Get categories

## Frontend Structure

- **Pages**: Route components in `src/pages/` 
- **Components**: Reusable UI in `src/components/`
- **Services**: API layer with axios interceptors in `src/services/api.ts`
- **Types**: TypeScript definitions in `src/types/`
- **Auth**: JWT handling with localStorage and auto-retry in `src/utils/auth.ts`

The app uses React Router with protected routes and automatic authentication handling.

## Environment Variables

Required `.env` file (copy from `.env.example`):
- `DATABASE_URL` - SQLite database path
- `JWT_SECRET` - Secret for JWT token signing
- `PORT` - Backend port (default: 3001)
- `VITE_API_URL` - Frontend API URL

## Demo Credentials

The application includes demo data seeding:
- Email: `demo@example.com`
- Password: `demo123`

Frontend automatically attempts demo login if no token is present.