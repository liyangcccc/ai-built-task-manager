import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: req.user.id,
          theme: 'system',
          language: 'en',
          timezone: 'America/New_York',
        },
      });
    }

    res.json({
      success: true,
      data: {
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
router.put('/', protect, [
  body('theme').optional().isIn(['light', 'dark', 'system']).withMessage('Invalid theme'),
  body('language').optional().isIn(['en', 'zh']).withMessage('Invalid language'),
  body('timezone').optional().isString().withMessage('Invalid timezone'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
    }

    const { theme, language, timezone } = req.body;

    // Check if settings exist
    let settings = await prisma.userSettings.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    if (!settings) {
      // Create new settings if they don't exist
      settings = await prisma.userSettings.create({
        data: {
          userId: req.user.id,
          theme: theme || 'system',
          language: language || 'en',
          timezone: timezone || 'America/New_York',
        },
      });
    } else {
      // Update existing settings
      settings = await prisma.userSettings.update({
        where: {
          userId: req.user.id,
        },
        data: {
          ...(theme && { theme }),
          ...(language && { language }),
          ...(timezone && { timezone }),
        },
      });
    }

    res.json({
      success: true,
      data: {
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Reset settings to defaults
// @route   POST /api/settings/reset
// @access  Private
router.post('/reset', protect, async (req, res, next) => {
  try {
    const settings = await prisma.userSettings.upsert({
      where: {
        userId: req.user.id,
      },
      update: {
        theme: 'system',
        language: 'en',
        timezone: 'America/New_York',
      },
      create: {
        userId: req.user.id,
        theme: 'system',
        language: 'en',
        timezone: 'America/New_York',
      },
    });

    res.json({
      success: true,
      data: {
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;