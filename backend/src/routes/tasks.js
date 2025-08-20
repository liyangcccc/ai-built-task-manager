import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// @desc    Get all tasks for authenticated user
// @route   GET /api/tasks
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { completed, priority, categoryId, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const where = {
      userId: req.user.id,
      ...(completed !== undefined && { completed: completed === 'true' }),
      ...(priority && { priority }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: {
        category: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
router.post('/', protect, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('categoryId').optional().isString(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
    }

    const { title, description, priority, dueDate, categoryId } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        categoryId,
        userId: req.user.id,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', protect, [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('completed').optional().isBoolean().withMessage('Completed must be boolean'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('categoryId').optional().isString(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
    }

    const { title, description, priority, completed, dueDate, categoryId } = req.body;

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        ...(completed !== undefined && { completed }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: {
        category: true,
      },
    });

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    // Check if task exists and belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    await prisma.task.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Toggle task completion status
// @route   PATCH /api/tasks/:id/complete
// @access  Private
router.patch('/:id/complete', protect, [
  body('completed').isBoolean().withMessage('Completed must be boolean'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
    }

    const { completed } = req.body;

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { completed },
      include: {
        category: true,
      },
    });

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

export default router;