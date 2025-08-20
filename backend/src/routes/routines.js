import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(protect);

// @desc    Get all routines for authenticated user
// @route   GET /api/routines
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const { isActive, recurrenceType, categoryId, search } = req.query;
    const userId = req.user.id;

    // Build filter conditions
    const where = {
      userId,
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(recurrenceType && { recurrenceType }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const routines = await prisma.routine.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Parse daysOfWeek JSON strings back to arrays
    const routinesWithParsedSchedule = routines.map(routine => ({
      ...routine,
      schedule: {
        recurrenceType: routine.recurrenceType,
        ...(routine.interval && { interval: routine.interval }),
        ...(routine.daysOfWeek && { daysOfWeek: JSON.parse(routine.daysOfWeek) }),
        ...(routine.dayOfMonth && { dayOfMonth: routine.dayOfMonth }),
        ...(routine.time && { time: routine.time })
      }
    }));

    res.json({
      success: true,
      count: routinesWithParsedSchedule.length,
      data: routinesWithParsedSchedule
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single routine
// @route   GET /api/routines/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const routine = await prisma.routine.findFirst({
      where: { id, userId },
      include: {
        category: true,
      }
    });

    if (!routine) {
      return res.status(404).json({
        success: false,
        error: 'Routine not found'
      });
    }

    // Parse daysOfWeek JSON string back to array
    const routineWithParsedSchedule = {
      ...routine,
      schedule: {
        recurrenceType: routine.recurrenceType,
        ...(routine.interval && { interval: routine.interval }),
        ...(routine.daysOfWeek && { daysOfWeek: JSON.parse(routine.daysOfWeek) }),
        ...(routine.dayOfMonth && { dayOfMonth: routine.dayOfMonth }),
        ...(routine.time && { time: routine.time })
      }
    };

    res.json({
      success: true,
      data: routineWithParsedSchedule
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new routine
// @route   POST /api/routines
// @access  Private
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('schedule.recurrenceType').isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).withMessage('Invalid recurrence type'),
  body('schedule.interval').optional().isInt({ min: 1 }).withMessage('Interval must be at least 1'),
  body('schedule.daysOfWeek').optional().isArray().withMessage('Days of week must be an array'),
  body('schedule.dayOfMonth').optional().isInt({ min: 1, max: 31 }).withMessage('Day of month must be between 1 and 31'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { title, description, categoryId, priority, schedule, isActive, startDate, endDate } = req.body;
    const userId = req.user.id;

    // Validate category if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category'
        });
      }
    }

    // Prepare schedule data for database
    const scheduleData = {
      recurrenceType: schedule.recurrenceType,
      ...(schedule.interval && { interval: schedule.interval }),
      ...(schedule.daysOfWeek && { daysOfWeek: JSON.stringify(schedule.daysOfWeek) }),
      ...(schedule.dayOfMonth && { dayOfMonth: schedule.dayOfMonth }),
      ...(schedule.time && { time: schedule.time })
    };

    const routine = await prisma.routine.create({
      data: {
        title,
        description,
        categoryId,
        priority: priority || 'MEDIUM',
        isActive: isActive !== undefined ? isActive : true,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        userId,
        ...scheduleData
      },
      include: {
        category: true,
      }
    });

    // Return routine with parsed schedule
    const routineWithParsedSchedule = {
      ...routine,
      schedule: {
        recurrenceType: routine.recurrenceType,
        ...(routine.interval && { interval: routine.interval }),
        ...(routine.daysOfWeek && { daysOfWeek: JSON.parse(routine.daysOfWeek) }),
        ...(routine.dayOfMonth && { dayOfMonth: routine.dayOfMonth }),
        ...(routine.time && { time: routine.time })
      }
    };

    res.status(201).json({
      success: true,
      data: routineWithParsedSchedule
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update routine
// @route   PUT /api/routines/:id
// @access  Private
router.put('/:id', [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('schedule.recurrenceType').optional().isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).withMessage('Invalid recurrence type'),
  body('schedule.interval').optional().isInt({ min: 1 }).withMessage('Interval must be at least 1'),
  body('schedule.daysOfWeek').optional().isArray().withMessage('Days of week must be an array'),
  body('schedule.dayOfMonth').optional().isInt({ min: 1, max: 31 }).withMessage('Day of month must be between 1 and 31'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { id } = req.params;
    const { title, description, categoryId, priority, schedule, isActive, startDate, endDate } = req.body;
    const userId = req.user.id;

    // Check if routine exists and belongs to user
    const existingRoutine = await prisma.routine.findFirst({
      where: { id, userId }
    });

    if (!existingRoutine) {
      return res.status(404).json({
        success: false,
        error: 'Routine not found'
      });
    }

    // Validate category if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (priority !== undefined) updateData.priority = priority;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    // Handle schedule updates
    if (schedule) {
      if (schedule.recurrenceType) updateData.recurrenceType = schedule.recurrenceType;
      if (schedule.interval !== undefined) updateData.interval = schedule.interval || null;
      if (schedule.daysOfWeek !== undefined) updateData.daysOfWeek = schedule.daysOfWeek ? JSON.stringify(schedule.daysOfWeek) : null;
      if (schedule.dayOfMonth !== undefined) updateData.dayOfMonth = schedule.dayOfMonth || null;
      if (schedule.time !== undefined) updateData.time = schedule.time || null;
    }

    const routine = await prisma.routine.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      }
    });

    // Return routine with parsed schedule
    const routineWithParsedSchedule = {
      ...routine,
      schedule: {
        recurrenceType: routine.recurrenceType,
        ...(routine.interval && { interval: routine.interval }),
        ...(routine.daysOfWeek && { daysOfWeek: JSON.parse(routine.daysOfWeek) }),
        ...(routine.dayOfMonth && { dayOfMonth: routine.dayOfMonth }),
        ...(routine.time && { time: routine.time })
      }
    };

    res.json({
      success: true,
      data: routineWithParsedSchedule
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Toggle routine active status
// @route   PATCH /api/routines/:id/status
// @access  Private
router.patch('/:id/status', [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { id } = req.params;
    const { isActive } = req.body;
    const userId = req.user.id;

    // Check if routine exists and belongs to user
    const existingRoutine = await prisma.routine.findFirst({
      where: { id, userId }
    });

    if (!existingRoutine) {
      return res.status(404).json({
        success: false,
        error: 'Routine not found'
      });
    }

    const routine = await prisma.routine.update({
      where: { id },
      data: { isActive },
      include: {
        category: true,
      }
    });

    // Return routine with parsed schedule
    const routineWithParsedSchedule = {
      ...routine,
      schedule: {
        recurrenceType: routine.recurrenceType,
        ...(routine.interval && { interval: routine.interval }),
        ...(routine.daysOfWeek && { daysOfWeek: JSON.parse(routine.daysOfWeek) }),
        ...(routine.dayOfMonth && { dayOfMonth: routine.dayOfMonth }),
        ...(routine.time && { time: routine.time })
      }
    };

    res.json({
      success: true,
      data: routineWithParsedSchedule
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete routine
// @route   DELETE /api/routines/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if routine exists and belongs to user
    const routine = await prisma.routine.findFirst({
      where: { id, userId }
    });

    if (!routine) {
      return res.status(404).json({
        success: false,
        error: 'Routine not found'
      });
    }

    await prisma.routine.delete({
      where: { id }
    });

    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    next(error);
  }
});

export default router;