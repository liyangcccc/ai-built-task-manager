# System Architecture Documentation

## Overview

The Personal Task Manager is a modern, full-stack web application designed with a multi-tier architecture that supports multi-user task management, real-time collaboration, and cross-platform access. The system is built using contemporary web technologies with a focus on security, scalability, and user experience.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                             │
├─────────────────────────────────────────────────────────────────┤
│  Web Browsers (Desktop/Mobile)    │    Network Devices          │
│  ┌─────────────────────────────┐   │   ┌─────────────────────────┐ │
│  │   React 18 + TypeScript    │   │   │  Other Laptops/Devices  │ │
│  │   - Responsive UI           │   │   │  Same WiFi Network      │ │
│  │   - Dark/Light Theme        │   │   │  http://IP:5179         │ │
│  │   - Multi-language          │   │   │                         │ │
│  │   - Real-time Updates       │   │   │                         │ │
│  └─────────────────────────────┘   │   └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   HTTPS/HTTP    │
                    │   REST API      │
                    │   JWT Tokens    │
                    └────────┬────────┘
                             │
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION TIER                          │
├─────────────────────────────────────────────────────────────────┤
│                    Node.js + Express.js                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   API Gateway   │  │   Middleware    │  │  Route Handlers │ │
│  │   - CORS        │  │   - JWT Auth    │  │  - Tasks API    │ │
│  │   - Rate Limit  │  │   - Validation  │  │  - Users API    │ │
│  │   - Security    │  │   - Error Hand. │  │  - Settings API │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   Prisma ORM    │
                    │   Type Safety   │
                    │   Migrations    │
                    └────────┬────────┘
                             │
┌─────────────────────────────────────────────────────────────────┐
│                        DATA TIER                               │
├─────────────────────────────────────────────────────────────────┤
│                      SQLite Database                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │     Users       │  │     Tasks       │  │   Categories    │ │
│  │   Settings      │  │   Routines      │  │   User Data     │ │
│  │   Auth Data     │  │   Schedules     │  │   Isolation     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Architecture Components

### 1. Frontend Architecture (React Application)

#### 1.1 Application Structure
```
src/
├── components/           # Reusable UI Components
│   ├── common/          # Shared components across pages
│   │   ├── AuthChecker.tsx      # Authentication wrapper
│   │   ├── BackButton.tsx       # Navigation helper
│   │   └── TaskDetailModal.tsx  # Task editing modal
│   └── layout/          # Layout components
│       └── Layout.tsx           # Main app layout with navigation
├── contexts/            # React Context for Global State
│   ├── SettingsContext.tsx     # Theme, language, timezone
│   └── LanguageContext.tsx     # Internationalization
├── pages/               # Route Components (Page Level)
│   ├── Auth.tsx                # Login/Registration
│   ├── Dashboard.tsx           # Main overview dashboard
│   ├── AllTasks.tsx           # Task management
│   ├── AddTask.tsx            # Task creation
│   ├── Settings.tsx           # User preferences
│   ├── Categories.tsx         # Category management
│   ├── Reports.tsx            # Analytics and export
│   ├── Routines.tsx           # Recurring tasks
│   └── ScheduledTasks.tsx     # Due date management
├── services/            # External API Communication
│   └── api.ts                 # Axios client with interceptors
├── utils/               # Utility Functions
│   ├── auth.ts               # Authentication helpers
│   └── dateUtils.ts          # Date manipulation
└── types/               # TypeScript Definitions
    └── Task.ts               # All entity types
```

#### 1.2 State Management Strategy
- **React Context API** for global state (settings, language)
- **Local Component State** for UI interactions
- **React Query/SWR** patterns for server state caching
- **localStorage** for client-side persistence

#### 1.3 UI/UX Architecture
- **Design System**: Tailwind CSS utility-first approach
- **Theme System**: CSS variables with dark/light mode support
- **Responsive Design**: Mobile-first responsive breakpoints
- **Accessibility**: ARIA labels, keyboard navigation
- **Internationalization**: Context-based translation system

### 2. Backend Architecture (Node.js Application)

#### 2.1 Express.js Server Structure
```
src/
├── routes/              # API Route Definitions
│   ├── auth.js         # Authentication endpoints
│   ├── tasks.js        # Task CRUD operations
│   ├── categories.js   # Category management
│   ├── routines.js     # Recurring task logic
│   ├── reports.js      # Data export and analytics
│   └── settings.js     # User preference management
├── middleware/          # Express Middleware
│   ├── auth.js         # JWT verification
│   ├── errorHandler.js # Global error handling
│   └── notFound.js     # 404 route handler
└── index.js            # Main server configuration
```

#### 2.2 Middleware Stack
1. **Helmet** - Security headers
2. **CORS** - Cross-origin resource sharing
3. **Rate Limiting** - API abuse prevention
4. **Morgan** - HTTP request logging
5. **Express JSON** - Request body parsing
6. **Custom Auth** - JWT token verification
7. **Error Handler** - Centralized error processing

#### 2.3 API Design Patterns
- **RESTful Architecture** with consistent endpoints
- **Standard Response Format**: `{ success: boolean, data: T, error?: string }`
- **HTTP Status Codes** following REST conventions
- **Request Validation** using express-validator
- **Error Handling** with custom error classes

### 3. Database Architecture (SQLite + Prisma)

#### 3.1 Database Schema
```sql
-- Users table (Authentication & Profile)
User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  password    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  tasks       Task[]
  categories  Category[]
  settings    UserSettings?
}

-- User Settings (Preferences)
UserSettings {
  id       String @id @default(cuid())
  userId   String @unique
  theme    String @default("light")      // light, dark, system
  language String @default("en")         // en, zh
  timezone String @default("UTC")
  
  // Relations
  user     User   @relation(fields: [userId], references: [id])
}

-- Categories (Task Organization)
Category {
  id        String   @id @default(cuid())
  name      String
  color     String   @default("#3B82F6")
  userId    String
  createdAt DateTime @default(now())
  
  // Relations
  user      User     @relation(fields: [userId], references: [id])
  tasks     Task[]
}

-- Tasks (Main Entity)
Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  completed   Boolean   @default(false)
  priority    Priority  @default(MEDIUM)    // LOW, MEDIUM, HIGH, URGENT
  dueDate     DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  userId      String
  categoryId  String?
  
  // Relations
  user        User      @relation(fields: [userId], references: [id])
  category    Category? @relation(fields: [categoryId], references: [id])
}

-- Routines (Recurring Tasks)
Routine {
  id              String          @id @default(cuid())
  title           String
  description     String?
  isActive        Boolean         @default(true)
  recurrenceType  RecurrenceType  // DAILY, WEEKLY, MONTHLY
  recurrenceValue Int             @default(1)
  userId          String
  categoryId      String?
  createdAt       DateTime        @default(now())
  
  // Relations
  user            User            @relation(fields: [userId], references: [id])
  category        Category?       @relation(fields: [categoryId], references: [id])
}
```

#### 3.2 Data Access Patterns
- **User Isolation**: All queries filtered by userId
- **Soft Deletes**: Completed tasks remain for history
- **Indexing Strategy**: Indexes on userId, dueDate, priority
- **Migration Strategy**: Prisma-managed schema versioning

#### 3.3 Database Relationships
```
User (1) ──── (Many) Task
User (1) ──── (Many) Category  
User (1) ──── (Many) Routine
User (1) ──── (One) UserSettings
Category (1) ──── (Many) Task
Category (1) ──── (Many) Routine
```

### 4. Authentication & Security Architecture

#### 4.1 Authentication Flow
```
Registration Flow:
Client → Email/Password → Server → bcrypt hash → Database → JWT Token → Client

Login Flow:
Client → Credentials → Server → bcrypt verify → JWT Token → Client

Protected Route:
Client → JWT Token → Server → JWT verify → Route Handler → Response
```

#### 4.2 Security Layers
1. **Input Validation**: express-validator on all inputs
2. **Password Hashing**: bcrypt with salt rounds
3. **JWT Tokens**: 30-day expiration with secret key
4. **CORS Policy**: Whitelist specific origins
5. **Rate Limiting**: Prevent brute force attacks
6. **Helmet Headers**: XSS, CSRF protection
7. **User Isolation**: Database-level data separation

#### 4.3 Token Management
- **Storage**: localStorage for web, secure storage for mobile
- **Refresh Strategy**: Auto-retry with token refresh
- **Expiration Handling**: Automatic logout on token expiry
- **Security**: HttpOnly cookies option for production

### 5. Network Architecture & Deployment

#### 5.1 Development Environment
```
Host Machine (Developer):
├── Backend Server: 0.0.0.0:3001
├── Frontend Server: 0.0.0.0:5179
├── Database: ./backend/prisma/dev.db
└── Network IP: 172.17.81.98

Network Devices (Users):
├── Device 1: http://172.17.81.98:5179
├── Device 2: http://172.17.81.98:5179
└── Device N: http://172.17.81.98:5179
```

#### 5.2 Network Configuration
- **Backend Binding**: `0.0.0.0:3001` for external access
- **Frontend Binding**: `0.0.0.0:5179` for external access
- **CORS Configuration**: Multiple origin support
- **Firewall Requirements**: Ports 3001, 5179 open
- **WiFi Network**: All devices on same network

#### 5.3 Production Considerations
- **Reverse Proxy**: Nginx for production deployment
- **SSL/TLS**: HTTPS certificates for security
- **Process Management**: PM2 for Node.js processes
- **Database**: PostgreSQL/MySQL for production scale
- **CDN**: Static asset delivery optimization

### 6. Data Flow Architecture

#### 6.1 User Registration Flow
```
1. User fills registration form
2. Frontend validates input
3. POST /api/auth/register
4. Backend validates data
5. Password hashed with bcrypt
6. User record created in database
7. JWT token generated
8. Token returned to frontend
9. User automatically logged in
10. Redirect to dashboard
```

#### 6.2 Task Management Flow
```
Create Task:
Dashboard → Add Task → Form → API → Database → Response → UI Update

Read Tasks:
Dashboard → API Request → Database Query → Response → Dashboard Display

Update Task:
Task Modal → Edit Form → API → Database → Response → UI Refresh

Delete Task:
Task List → Delete Button → Confirmation → API → Database → UI Remove
```

#### 6.3 Settings Synchronization Flow
```
1. User changes setting in UI
2. Immediate UI update (optimistic)
3. API call to backend
4. Database update
5. Response confirmation
6. Context state update
7. Theme/language applied globally
```

### 7. Performance Architecture

#### 7.1 Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **Bundle Optimization**: Vite treeshaking
- **Asset Optimization**: Image compression, lazy loading
- **Caching Strategy**: Browser caching, localStorage
- **Virtual Scrolling**: Large task list optimization

#### 7.2 Backend Optimization
- **Database Indexing**: User ID, date fields
- **Query Optimization**: Prisma query optimization
- **Response Caching**: Redis for frequent queries
- **Connection Pooling**: Database connection management
- **Rate Limiting**: API abuse prevention

#### 7.3 Real-time Features
- **Polling Strategy**: Periodic task list refresh
- **WebSocket Ready**: Architecture supports real-time updates
- **Optimistic Updates**: Immediate UI feedback
- **Conflict Resolution**: Last-write-wins strategy

### 8. Error Handling & Monitoring

#### 8.1 Error Handling Strategy
```
Frontend Errors:
├── Network Errors → Retry logic + User notification
├── Validation Errors → Inline form feedback
├── Auth Errors → Automatic token refresh
└── Unknown Errors → Error boundary + logging

Backend Errors:
├── Validation Errors → 400 with detailed message
├── Auth Errors → 401 with retry instructions
├── Not Found → 404 with helpful message
├── Server Errors → 500 with error ID
└── Database Errors → Graceful degradation
```

#### 8.2 Logging & Monitoring
- **Request Logging**: Morgan for HTTP requests
- **Error Logging**: Console + file logging
- **Performance Monitoring**: Response time tracking
- **User Analytics**: Task completion metrics
- **Health Checks**: `/health` endpoint monitoring

### 9. Internationalization Architecture

#### 9.1 Translation System
```
Language Context:
├── Translation Keys → English/Chinese mappings
├── Parameter Substitution → Dynamic content
├── Fallback Strategy → English as default
└── Context Provider → Global language state

Implementation:
├── Translation Files → Static JSON objects
├── useLanguage Hook → Context consumption
├── t() Function → Key-based translation
└── Real-time Switching → Immediate UI update
```

#### 9.2 Supported Features
- **Static Text Translation**: All UI labels and messages
- **Dynamic Content**: Parameter substitution in translations
- **Date Localization**: Locale-specific date formatting
- **Number Formatting**: Locale-specific number display
- **RTL Support Ready**: Architecture supports right-to-left languages

### 10. Scalability Considerations

#### 10.1 Current Limitations
- **Single Database**: SQLite file-based storage
- **No Clustering**: Single Node.js process
- **Local Network**: WiFi-only access
- **Manual Scaling**: No auto-scaling capabilities

#### 10.2 Scaling Strategies
- **Database Migration**: PostgreSQL with connection pooling
- **Horizontal Scaling**: Load balancer + multiple app instances
- **Caching Layer**: Redis for session and data caching
- **CDN Integration**: Static asset delivery optimization
- **Microservices**: Split into auth, task, notification services

### 11. Security Best Practices

#### 11.1 Implemented Security
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ User data isolation

#### 11.2 Production Security Checklist
- [ ] HTTPS/TLS encryption
- [ ] Environment variable protection
- [ ] Database encryption at rest
- [ ] Audit logging
- [ ] Intrusion detection
- [ ] Regular security updates
- [ ] Penetration testing
- [ ] GDPR compliance (if applicable)

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | User interface and client logic |
| **Styling** | Tailwind CSS | Utility-first styling with dark mode |
| **Build Tool** | Vite | Fast development and optimized builds |
| **State Management** | React Context + Local State | Global and component state |
| **HTTP Client** | Axios | API communication with interceptors |
| **Backend** | Node.js + Express.js | Server runtime and web framework |
| **Database ORM** | Prisma | Type-safe database access |
| **Database** | SQLite | Lightweight, file-based storage |
| **Authentication** | JWT + bcrypt | Stateless auth with secure passwords |
| **Security** | Helmet + CORS + Rate Limiting | Multiple security layers |
| **Development** | nodemon + Hot Reload | Fast development iteration |

This architecture provides a robust foundation for a multi-user task management system with room for future enhancements and scaling as requirements grow.