const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

class ElectronBackend {
  constructor() {
    this.app = express();
    this.server = null;
    this.prisma = null;
    this.port = 3001;
  }

  async initialize() {
    try {
      // Setup database
      await this.setupDatabase();
      
      // Setup Express app
      this.setupMiddleware();
      this.setupRoutes();
      
      // Start server
      await this.startServer();
      
      console.log('✅ Electron backend initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Electron backend:', error);
      return false;
    }
  }

  async setupDatabase() {
    // Set up database path for Electron app
    const appDataPath = require('electron').app.getPath('userData');
    const dbPath = path.join(appDataPath, 'tasks.db');
    
    // Initialize Prisma with local database
    process.env.DATABASE_URL = `file:${dbPath}`;
    
    const { PrismaClient } = require('@prisma/client');
    this.prisma = new PrismaClient();
    
    // Ensure database is created and seeded
    await this.ensureDatabase();
  }

  async ensureDatabase() {
    try {
      // Test database connection
      await this.prisma.$connect();
      
      // Check if we have any users
      const userCount = await this.prisma.user.count();
      
      if (userCount === 0) {
        // Create demo user and seed data
        await this.seedDatabase();
      }
      
      console.log('📚 Database ready');
    } catch (error) {
      console.error('Database setup error:', error);
      throw error;
    }
  }

  async seedDatabase() {
    try {
      // Create demo user
      const hashedPassword = await bcrypt.hash('demo123', 10);
      const user = await this.prisma.user.create({
        data: {
          name: 'Demo User',
          email: 'demo@example.com',
          password: hashedPassword,
        },
      });

      // Create categories
      const categories = await Promise.all([
        this.prisma.category.create({
          data: { name: 'Work', color: '#EF4444' },
        }),
        this.prisma.category.create({
          data: { name: 'Personal', color: '#10B981' },
        }),
        this.prisma.category.create({
          data: { name: 'Shopping', color: '#F59E0B' },
        }),
        this.prisma.category.create({
          data: { name: 'Health', color: '#8B5CF6' },
        }),
      ]);

      // Create sample tasks
      await Promise.all([
        this.prisma.task.create({
          data: {
            title: 'Complete project proposal',
            description: 'Finish the Q4 project proposal for the client meeting',
            priority: 'HIGH',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            userId: user.id,
            categoryId: categories[0].id,
          },
        }),
        this.prisma.task.create({
          data: {
            title: 'Plan weekend trip',
            description: 'Research destinations and book accommodation',
            priority: 'LOW',
            userId: user.id,
            categoryId: categories[1].id,
          },
        }),
        this.prisma.task.create({
          data: {
            title: 'Buy groceries',
            description: 'Milk, bread, eggs, fruits, and vegetables',
            priority: 'MEDIUM',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            userId: user.id,
            categoryId: categories[2].id,
          },
        }),
        this.prisma.task.create({
          data: {
            title: 'Exercise routine',
            description: 'Go for a 30-minute jog in the park',
            priority: 'MEDIUM',
            completed: true,
            userId: user.id,
            categoryId: categories[3].id,
          },
        }),
      ]);

      console.log('🌱 Database seeded successfully');
    } catch (error) {
      console.error('Seeding error:', error);
      throw error;
    }
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Auth middleware
    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ success: false, error: 'Access token required' });
      }

      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
          return res.status(403).json({ success: false, error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
      });
    };

    // Auth routes
    this.app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        const user = await this.prisma.user.findUnique({
          where: { email },
        });

        if (!user || !await bcrypt.compare(password, user.password)) {
          return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { id: user.id },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '30d' }
        );

        res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              createdAt: user.createdAt,
            },
            token,
          },
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Tasks routes
    this.app.get('/api/tasks', authenticateToken, async (req, res) => {
      try {
        const tasks = await this.prisma.task.findMany({
          where: { userId: req.user.id },
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        });

        res.json({
          success: true,
          count: tasks.length,
          data: tasks,
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/tasks', authenticateToken, async (req, res) => {
      try {
        const { title, description, priority, categoryId, dueDate } = req.body;
        
        const task = await this.prisma.task.create({
          data: {
            title,
            description,
            priority,
            categoryId,
            dueDate: dueDate ? new Date(dueDate) : null,
            userId: req.user.id,
          },
          include: { category: true },
        });

        res.status(201).json({
          success: true,
          data: task,
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Categories routes
    this.app.get('/api/categories', authenticateToken, async (req, res) => {
      try {
        const categories = await this.prisma.category.findMany({
          include: {
            _count: {
              select: { tasks: true },
            },
          },
        });

        res.json({
          success: true,
          count: categories.length,
          data: categories,
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'OK', message: 'Electron backend is running' });
    });
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, 'localhost', () => {
        console.log(`🚀 Electron backend running on http://localhost:${this.port}`);
        resolve();
      });

      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${this.port} is busy, trying ${this.port + 1}`);
          this.port++;
          this.startServer().then(resolve).catch(reject);
        } else {
          reject(error);
        }
      });
    });
  }

  async shutdown() {
    if (this.server) {
      this.server.close();
    }
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
    console.log('🛑 Electron backend shutdown');
  }
}

module.exports = ElectronBackend;