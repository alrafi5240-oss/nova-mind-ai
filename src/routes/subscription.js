const express = require('express');
const { protect } = require('../middleware/auth');
const {
  PLANS,
  getPlans,
  createCustomer,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  constructWebhookEvent,
  getSubscription,
} = require('../services/stripeService');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/subscription/plans - Public: list plans
router.get('/plans', (req, res) => {
  const plans = Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    features: plan.features,
    messageLimit: plan.messageLimit === Infinity ? 'Unlimited' : plan.messageLimit,
    popular: key === 'pro',
  }));
  res.json({ success: true, data: { plans } });
});

// POST /api/subscription/checkout - Create Stripe checkout session
router.post('/checkout', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan.' });
    }

    const planData = PLANS[plan];
    if (!planData.priceId) {
      return res.status(400).json({ success: false, message: 'Stripe price ID not configured.' });
    }

    // Create or get Stripe customer
    let customerId = req.user.subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await createCustomer({
        email: req.user.email,
        name: req.user.name,
        userId: req.user._id,
      });
      customerId = customer.id;
      req.user.subscription.stripeCustomerId = customerId;
      await req.user.save({ validateBeforeSave: false });
    }

    const session = await createCheckoutSession({
      customerId,
      priceId: planData.priceId,
      userId: req.user._id,
    });

    res.json({ success: true, data: { sessionId: session.id, url: session.url } });
  } catch (error) {
    logger.error('Checkout error:', error);
    res.status(500).json({ success: false, message: 'Failed to create checkout session.' });
  }
});

// POST /api/subscription/portal - Billing portal
router.post('/portal', protect, async (req, res) => {
  try {
    const customerId = req.user.subscription.stripeCustomerId;
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'No billing account found.' });
    }
    const session = await createPortalSession({ customerId });
    res.json({ success: true, data: { url: session.url } });
  } catch (error) {
    logger.error('Portal error:', error);
    res.status(500).json({ success: false, message: 'Failed to open billing portal.' });
  }
});

// POST /api/subscription/cancel - Cancel subscription
router.post('/cancel', protect, async (req, res) => {
  try {
    const { stripeSubscriptionId } = req.user.subscription;
    if (!stripeSubscriptionId) {
      return res.status(400).json({ success: false, message: 'No active subscription.' });
    }
    await cancelSubscription(stripeSubscriptionId);
    req.user.subscription.cancelAtPeriodEnd = true;
    await req.user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Subscription will cancel at end of billing period.' });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel subscription.' });
  }
});

// GET /api/subscription/status - Current subscription info
router.get('/status', protect, async (req, res) => {
  const { subscription, usage, messageLimit, isSubscriptionActive } = req.user;
  res.json({
    success: true,
    data: {
      plan: subscription.plan,
      status: subscription.status,
      isActive: isSubscriptionActive,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      usage: {
        messagesThisMonth: usage.messagesThisMonth,
        totalMessages: usage.totalMessages,
        limit: messageLimit === Infinity ? 'Unlimited' : messageLimit,
        percentage: messageLimit === Infinity ? 0 : Math.round((usage.messagesThisMonth / messageLimit) * 100),
      },
      features: PLANS[subscription.plan]?.features || [],
    },
  });
});

// POST /api/subscription/webhook - Stripe webhook (raw body needed)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId && session.subscription) {
          const sub = await getSubscription(session.subscription);
          const planName = Object.entries(PLANS).find(
            ([, p]) => p.priceId === sub.items.data[0]?.price?.id
          )?.[0] || 'pro';

          await User.findByIdAndUpdate(userId, {
            'subscription.plan': planName,
            'subscription.status': 'active',
            'subscription.stripeSubscriptionId': session.subscription,
            'subscription.currentPeriodEnd': new Date(sub.current_period_end * 1000),
            'subscription.cancelAtPeriodEnd': false,
          });
          logger.info(`Subscription activated for user ${userId}, plan: ${planName}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const user = await User.findOne({ 'subscription.stripeSubscriptionId': sub.id });
        if (user) {
          const planName = Object.entries(PLANS).find(
            ([, p]) => p.priceId === sub.items.data[0]?.price?.id
          )?.[0] || user.subscription.plan;

          user.subscription.plan = planName;
          user.subscription.status = sub.status;
          user.subscription.currentPeriodEnd = new Date(sub.current_period_end * 1000);
          user.subscription.cancelAtPeriodEnd = sub.cancel_at_period_end;
          await user.save({ validateBeforeSave: false });
          logger.info(`Subscription updated for user ${user._id}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const user = await User.findOne({ 'subscription.stripeSubscriptionId': sub.id });
        if (user) {
          user.subscription.plan = 'free';
          user.subscription.status = 'cancelled';
          user.subscription.stripeSubscriptionId = null;
          user.subscription.currentPeriodEnd = null;
          await user.save({ validateBeforeSave: false });
          logger.info(`Subscription cancelled for user ${user._id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const user = await User.findOne({ 'subscription.stripeCustomerId': invoice.customer });
        if (user) {
          user.subscription.status = 'past_due';
          await user.save({ validateBeforeSave: false });
          logger.warn(`Payment failed for user ${user._id}`);
        }
        break;
      }

      default:
        logger.debug(`Unhandled webhook event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

module.exports = router;
