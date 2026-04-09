const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired.', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

const requireSubscription = (allowedPlans = ['pro', 'enterprise']) => {
  return (req, res, next) => {
    const { subscription } = req.user;
    if (!allowedPlans.includes(subscription.plan)) {
      return res.status(403).json({
        success: false,
        message: 'This feature requires an upgraded subscription.',
        code: 'UPGRADE_REQUIRED',
        currentPlan: subscription.plan,
        requiredPlans: allowedPlans,
      });
    }
    if (!req.user.isSubscriptionActive) {
      return res.status(403).json({
        success: false,
        message: 'Your subscription is not active.',
        code: 'SUBSCRIPTION_INACTIVE',
      });
    }
    next();
  };
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
  return { accessToken, refreshToken };
};

module.exports = { protect, requireAdmin, requireSubscription, generateTokens };
