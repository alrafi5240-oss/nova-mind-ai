const rateLimit = require('express-rate-limit');

const createLimiter = (options = {}) =>
  rateLimit({
    windowMs: options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: options.max || parseInt(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: options.message || 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((options.windowMs || 15 * 60 * 1000) / 1000),
    },
    skip: (req) => req.user?.role === 'admin',
  });

const globalLimiter = createLimiter();

const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

const chatLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: (req) => {
    const plan = req.user?.subscription?.plan || 'free';
    const limits = { free: 5, pro: 30, enterprise: 100 };
    return limits[plan] || 5;
  },
  message: 'Chat rate limit exceeded. Please slow down.',
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

module.exports = { globalLimiter, authLimiter, chatLimiter };
