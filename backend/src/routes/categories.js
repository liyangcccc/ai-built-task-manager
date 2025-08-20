import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        tasks: {
          where: {
            userId: req.user.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color'),
  body('description').optional().trim(),
  body('icon').optional().trim(),
  body('defaultPriority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid default priority'),
  body('notes').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
    }

    const { name, color, description, icon, defaultPriority, notes } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        color: color || '#3B82F6',
        description: description || null,
        icon: icon || null,
        defaultPriority: defaultPriority || 'MEDIUM',
        notes: notes || null,
      },
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
router.put('/:id', protect, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color'),
  body('description').optional().trim(),
  body('icon').optional().trim(),
  body('defaultPriority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid default priority'),
  body('notes').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
    }

    const { name, color, description, icon, defaultPriority, notes } = req.body;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(defaultPriority && { defaultPriority }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const { reassignTo } = req.query;
    
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { tasks: true, routines: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    // If there are tasks/routines and no reassignment specified, prevent deletion
    if ((category._count.tasks > 0 || category._count.routines > 0) && !reassignTo) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with existing tasks. Please specify a category to reassign tasks to.',
        data: {
          taskCount: category._count.tasks,
          routineCount: category._count.routines,
        },
      });
    }

    // Reassign tasks and routines if specified
    if (reassignTo) {
      await prisma.task.updateMany({
        where: { categoryId: req.params.id },
        data: { categoryId: reassignTo === 'null' ? null : reassignTo },
      });

      await prisma.routine.updateMany({
        where: { categoryId: req.params.id },
        data: { categoryId: reassignTo === 'null' ? null : reassignTo },
      });
    }

    await prisma.category.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      data: { 
        id: req.params.id,
        reassignedTasks: category._count.tasks,
        reassignedRoutines: category._count.routines,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Merge categories
// @route   POST /api/categories/:id/merge/:targetId
// @access  Private
router.post('/:id/merge/:targetId', protect, async (req, res, next) => {
  try {
    const sourceId = req.params.id;
    const targetId = req.params.targetId;

    if (sourceId === targetId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot merge a category with itself',
      });
    }

    // Check if both categories exist
    const [sourceCategory, targetCategory] = await Promise.all([
      prisma.category.findUnique({
        where: { id: sourceId },
        include: {
          _count: {
            select: { tasks: true, routines: true },
          },
        },
      }),
      prisma.category.findUnique({
        where: { id: targetId },
      }),
    ]);

    if (!sourceCategory) {
      return res.status(404).json({
        success: false,
        error: 'Source category not found',
      });
    }

    if (!targetCategory) {
      return res.status(404).json({
        success: false,
        error: 'Target category not found',
      });
    }

    // Move all tasks and routines from source to target
    await prisma.task.updateMany({
      where: { categoryId: sourceId },
      data: { categoryId: targetId },
    });

    await prisma.routine.updateMany({
      where: { categoryId: sourceId },
      data: { categoryId: targetId },
    });

    // Delete the source category
    await prisma.category.delete({
      where: { id: sourceId },
    });

    res.json({
      success: true,
      data: {
        sourceCategory: sourceCategory.name,
        targetCategory: targetCategory.name,
        mergedTasks: sourceCategory._count.tasks,
        mergedRoutines: sourceCategory._count.routines,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get category analytics
// @route   GET /api/categories/:id/analytics
// @access  Private
router.get('/:id/analytics', protect, async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    
    const analytics = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        tasks: {
          where: {
            userId: req.user.id,
          },
          select: {
            completed: true,
            priority: true,
            createdAt: true,
          },
        },
        routines: {
          where: {
            userId: req.user.id,
          },
          select: {
            isActive: true,
            priority: true,
            createdAt: true,
          },
        },
      },
    });

    if (!analytics) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    const stats = {
      totalTasks: analytics.tasks.length,
      completedTasks: analytics.tasks.filter(t => t.completed).length,
      pendingTasks: analytics.tasks.filter(t => !t.completed).length,
      totalRoutines: analytics.routines.length,
      activeRoutines: analytics.routines.filter(r => r.isActive).length,
      priorityDistribution: {
        LOW: analytics.tasks.filter(t => t.priority === 'LOW').length,
        MEDIUM: analytics.tasks.filter(t => t.priority === 'MEDIUM').length,
        HIGH: analytics.tasks.filter(t => t.priority === 'HIGH').length,
        URGENT: analytics.tasks.filter(t => t.priority === 'URGENT').length,
      },
    };

    res.json({
      success: true,
      data: {
        category: analytics,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;