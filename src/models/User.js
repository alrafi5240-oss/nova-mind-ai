const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: null,
    },
    language: {
      type: String,
      enum: ['en', 'bn', 'ar', 'hi', 'fr', 'es', 'zh', 'ru', 'pt', 'de'],
      default: 'en',
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'cancelled', 'past_due'],
        default: 'active',
      },
      stripeCustomerId: { type: String, default: null },
      stripeSubscriptionId: { type: String, default: null },
      currentPeriodEnd: { type: Date, default: null },
      cancelAtPeriodEnd: { type: Boolean, default: false },
    },
    usage: {
      messagesThisMonth: { type: Number, default: 0 },
      totalMessages: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now },
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshTokens: [{ type: String, select: false }],
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'subscription.stripeCustomerId': 1 });

// Virtual: message limit based on plan
userSchema.virtual('messageLimit').get(function () {
  const limits = { free: 20, pro: 2000, enterprise: Infinity };
  return limits[this.subscription.plan] || 20;
});

// Virtual: is subscription active
userSchema.virtual('isSubscriptionActive').get(function () {
  if (this.subscription.plan === 'free') return true;
  if (this.subscription.status !== 'active') return false;
  if (this.subscription.currentPeriodEnd && new Date() > this.subscription.currentPeriodEnd) return false;
  return true;
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Reset monthly usage if new month
userSchema.pre('save', function (next) {
  const now = new Date();
  const lastReset = this.usage.lastResetDate;
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.usage.messagesThisMonth = 0;
    this.usage.lastResetDate = now;
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check message limit
userSchema.methods.canSendMessage = function () {
  if (this.subscription.plan !== 'free') return true;
  return this.usage.messagesThisMonth < this.messageLimit;
};

// Increment usage
userSchema.methods.incrementUsage = async function () {
  this.usage.messagesThisMonth += 1;
  this.usage.totalMessages += 1;
  return this.save({ validateBeforeSave: false });
};

const User = mongoose.model('User', userSchema);
module.exports = User;
