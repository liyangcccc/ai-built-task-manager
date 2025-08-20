import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to get date ranges
const getDateRange = (period) => {
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'all':
    default:
      startDate = new Date('2000-01-01');
      break;
  }
  
  return { startDate, endDate: now };
};

// Helper function to calculate streak
const calculateStreak = (tasks) => {
  if (!tasks.length) return 0;
  
  // Group completed tasks by date
  const completionDates = tasks
    .filter(task => task.completed)
    .map(task => new Date(task.updatedAt).toDateString())
    .sort()
    .filter((date, index, arr) => arr.indexOf(date) === index); // Remove duplicates
  
  if (!completionDates.length) return 0;
  
  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  // Check if user was productive today or yesterday
  if (!completionDates.includes(today) && !completionDates.includes(yesterday)) {
    return 0;
  }
  
  // Count consecutive days backwards from today/yesterday
  let checkDate = completionDates.includes(today) ? today : yesterday;
  let currentDate = new Date(checkDate);
  
  while (completionDates.includes(currentDate.toDateString())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
};

// @desc    Get comprehensive reports data
// @route   GET /api/reports
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { period = 'all', categoryId } = req.query;
    const { startDate, endDate } = getDateRange(period);
    
    // Base filter for user's data
    const baseFilter = {
      userId: req.user.id,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };
    
    // Add category filter if specified
    if (categoryId && categoryId !== 'all') {
      baseFilter.categoryId = categoryId;
    }
    
    // Fetch all data in parallel
    const [
      tasks,
      categories,
      routines,
      allUserTasks, // For streak calculation
    ] = await Promise.all([
      prisma.task.findMany({
        where: baseFilter,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.category.findMany({
        include: {
          _count: {
            select: { tasks: true },
          },
        },
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.routine.findMany({
        where: {
          userId: req.user.id,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          category: true,
        },
      }),
      prisma.task.findMany({
        where: {
          userId: req.user.id,
        },
        select: {
          completed: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
    ]);
    
    // Calculate basic metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;
    
    // Calculate priority distribution
    const priorityDistribution = {
      URGENT: tasks.filter(t => t.priority === 'URGENT').length,
      HIGH: tasks.filter(t => t.priority === 'HIGH').length,
      MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
      LOW: tasks.filter(t => t.priority === 'LOW').length,
    };
    
    // Calculate category distribution
    const categoryDistribution = {};
    categories.forEach(category => {
      const categoryTasks = tasks.filter(task => task.categoryId === category.id);
      if (categoryTasks.length > 0) {
        categoryDistribution[category.name] = {
          total: categoryTasks.length,
          completed: categoryTasks.filter(t => t.completed).length,
          color: category.color,
        };
      }
    });
    
    // Calculate overdue tasks
    const todayString = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      task.dueDate.split('T')[0] < todayString
    ).length;
    
    // Calculate productive days (days with at least one completed task)
    const productiveDays = new Set(
      tasks
        .filter(task => task.completed)
        .map(task => new Date(task.updatedAt).toDateString())
    ).size;
    
    // Calculate current streak
    const currentStreak = calculateStreak(allUserTasks);
    
    // Time-based summary
    const today = new Date().toDateString();
    const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const todayTasks = tasks.filter(task => 
      new Date(task.createdAt).toDateString() === today
    );
    const weekTasks = tasks.filter(task => 
      new Date(task.createdAt) >= thisWeek
    );
    const monthTasks = tasks.filter(task => 
      new Date(task.createdAt) >= thisMonth
    );
    
    const summary = {
      today: {
        total: todayTasks.length,
        completed: todayTasks.filter(t => t.completed).length,
        completionRate: todayTasks.length > 0 ? (todayTasks.filter(t => t.completed).length / todayTasks.length * 100) : 0,
      },
      week: {
        total: weekTasks.length,
        completed: weekTasks.filter(t => t.completed).length,
        completionRate: weekTasks.length > 0 ? (weekTasks.filter(t => t.completed).length / weekTasks.length * 100) : 0,
      },
      month: {
        total: monthTasks.length,
        completed: monthTasks.filter(t => t.completed).length,
        completionRate: monthTasks.length > 0 ? (monthTasks.filter(t => t.completed).length / monthTasks.length * 100) : 0,
      },
    };
    
    // Top categories by task count
    const topCategories = Object.entries(categoryDistribution)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));
    
    res.json({
      success: true,
      data: {
        overview: {
          totalTasks,
          completedTasks,
          pendingTasks,
          completionRate: Math.round(completionRate * 100) / 100,
          overdueTasks,
          productiveDays,
          currentStreak,
          totalRoutines: routines.length,
          activeRoutines: routines.filter(r => r.isActive).length,
        },
        priorityDistribution,
        categoryDistribution,
        topCategories,
        summary,
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get productivity trends data
// @route   GET /api/reports/trends
// @access  Private
router.get('/trends', protect, async (req, res, next) => {
  try {
    const { period = '30' } = req.query; // days
    const days = parseInt(period);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    // Get tasks created and completed for each day
    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user.id,
        OR: [
          {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            updatedAt: {
              gte: startDate,
              lte: endDate,
            },
            completed: true,
          },
        ],
      },
      select: {
        createdAt: true,
        updatedAt: true,
        completed: true,
      },
    });
    
    // Generate daily data
    const dailyData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toDateString();
      
      const tasksCreated = tasks.filter(task =>
        new Date(task.createdAt).toDateString() === dateStr
      ).length;
      
      const tasksCompleted = tasks.filter(task =>
        task.completed && new Date(task.updatedAt).toDateString() === dateStr
      ).length;
      
      dailyData.push({
        date: currentDate.toISOString().split('T')[0],
        tasksCreated,
        tasksCompleted,
        productivity: tasksCompleted > 0 ? 1 : 0, // Binary productivity indicator
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json({
      success: true,
      data: dailyData,
    });
  } catch (error) {
    next(error);
  }
});

export default router;