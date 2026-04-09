const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const logger = require('../utils/logger');

const router = express.Router();

router.use(protect);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// GET /api/user/profile - Get profile
router.get('/profile', (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      language: user.language,
      subscription: user.subscription,
      usage: user.usage,
      messageLimit: user.messageLimit,
      isSubscriptionActive: user.isSubscriptionActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
  });
});

// PATCH /api/user/profile - Update profile
router.patch(
  '/profile',
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('language').optional().isIn(['en', 'bn', 'ar', 'hi', 'fr', 'es', 'zh', 'ru', 'pt', 'de']),
    body('avatar').optional().isURL(),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, language, avatar } = req.body;
      const update = {};
      if (name) update.name = name;
      if (language) update.language = language;
      if (avatar) update.avatar = avatar;

      const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
      res.json({ success: true, message: 'Profile updated.', data: { name: user.name, language: user.language, avatar: user.avatar } });
    } catch (error) {
      logger.error('Profile update error:', error);
      res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
  }
);

// PATCH /api/user/password - Change password
router.patch(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must be strong (uppercase, lowercase, number)'),
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('+password');
      const valid = await user.comparePassword(req.body.currentPassword);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
      user.password = req.body.newPassword;
      await user.save();
      res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
      logger.error('Password change error:', error);
      res.status(500).json({ success: false, message: 'Failed to change password.' });
    }
  }
);

// GET /api/user/stats - Usage stats
router.get('/stats', async (req, res) => {
  try {
    const totalConversations = await Conversation.countDocuments({ userId: req.user._id });
    const archivedConversations = await Conversation.countDocuments({ userId: req.user._id, isArchived: true });

    res.json({
      success: true,
      data: {
        totalConversations,
        activeConversations: totalConversations - archivedConversations,
        archivedConversations,
        messagesThisMonth: req.user.usage.messagesThisMonth,
        totalMessages: req.user.usage.totalMessages,
        plan: req.user.subscription.plan,
        messageLimit: req.user.messageLimit === Infinity ? 'Unlimited' : req.user.messageLimit,
      },
    });
  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to load stats.' });
  }
});

// DELETE /api/user/account - Delete account
router.delete('/account', async (req, res) => {
  try {
    await Conversation.deleteMany({ userId: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    logger.error('Account deletion error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account.' });
  }
});

// ===== ADMIN ROUTES =====

// GET /api/user/admin/users - List all users
router.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, plan, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (plan) filter['subscription.plan'] = plan;
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

    const [users, total] = await Promise.all([
      User.find(filter).select('-password -refreshTokens').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (error) {
    logger.error('Admin list users error:', error);
    res.status(500).json({ success: false, message: 'Failed to load users.' });
  }
});

// GET /api/user/admin/stats - Platform stats
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [totalUsers, planBreakdown, totalConversations, recentUsers] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        { $group: { _id: '$subscription.plan', count: { $sum: 1 } } },
      ]),
      Conversation.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email subscription.plan createdAt'),
    ]);

    const plans = { free: 0, pro: 0, enterprise: 0 };
    planBreakdown.forEach(({ _id, count }) => { if (plans[_id] !== undefined) plans[_id] = count; });

    const monthRevenue = (plans.pro * 200) + (plans.enterprise * 250);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalConversations,
        plans,
        monthlyRevenue: monthRevenue,
        recentUsers,
      },
    });
  } catch (error) {
    logger.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to load stats.' });
  }
});

module.exports = router;
