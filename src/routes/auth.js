const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateTokens, protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('language').optional().isIn(['en', 'bn', 'ar', 'hi', 'fr', 'es', 'zh', 'ru', 'pt', 'de']),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password, language = 'en' } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already registered.' });
      }

      const user = await User.create({ name, email, password, language });
      const { accessToken, refreshToken } = generateTokens(user._id);

      // Store refresh token
      user.refreshTokens = [refreshToken];
      user.lastLoginAt = new Date();
      await user.save({ validateBeforeSave: false });

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            language: user.language,
            subscription: user.subscription,
            usage: user.usage,
            messageLimit: user.messageLimit,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      logger.error('Register error:', error);
      res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password +refreshTokens');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
      }

      const { accessToken, refreshToken } = generateTokens(user._id);

      // Manage refresh tokens (keep last 5)
      user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
      user.lastLoginAt = new Date();
      await user.save({ validateBeforeSave: false });

      res.json({
        success: true,
        message: 'Login successful.',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            language: user.language,
            subscription: user.subscription,
            usage: user.usage,
            messageLimit: user.messageLimit,
            isSubscriptionActive: user.isSubscriptionActive,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.refreshTokens?.includes(refreshToken)) {
      return res.status(401).json({ success: false, message: 'Refresh token revoked.' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Rotate refresh token
    user.refreshTokens = user.refreshTokens
      .filter((t) => t !== refreshToken)
      .concat(newRefreshToken)
      .slice(-5);
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ success: false, message: 'Token refresh failed.' });
  }
});

// POST /api/auth/logout
router.post('/logout', protect, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      req.user.refreshTokens = (req.user.refreshTokens || []).filter((t) => t !== refreshToken);
      await req.user.save({ validateBeforeSave: false });
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed.' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        language: req.user.language,
        avatar: req.user.avatar,
        subscription: req.user.subscription,
        usage: req.user.usage,
        messageLimit: req.user.messageLimit,
        isSubscriptionActive: req.user.isSubscriptionActive,
        createdAt: req.user.createdAt,
        lastLoginAt: req.user.lastLoginAt,
      },
    },
  });
});

module.exports = router;
