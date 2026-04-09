const Stripe = require('stripe');
const logger = require('../utils/logger');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'usd',
    features: ['20 messages/month', 'Basic AI chat', 'Multi-language support', 'Email support'],
    messageLimit: 20,
    priceId: null,
  },
  pro: {
    name: 'Pro',
    price: 200,
    currency: 'usd',
    features: [
      '2,000 messages/month',
      'Advanced AI models',
      'Priority support',
      'Chat history (90 days)',
      'API access',
      'Multi-language support',
    ],
    messageLimit: 2000,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  enterprise: {
    name: 'Enterprise',
    price: 250,
    currency: 'usd',
    features: [
      'Unlimited messages',
      'Latest AI models',
      '24/7 dedicated support',
      'Unlimited chat history',
      'Full API access',
      'Custom integrations',
      'Team collaboration',
      'Admin dashboard',
    ],
    messageLimit: Infinity,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  },
};

const getPlans = () => PLANS;

const createCustomer = async ({ email, name, userId }) => {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId: userId.toString() },
  });
  return customer;
};

const createCheckoutSession = async ({ customerId, priceId, userId, successUrl, cancelUrl }) => {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl || `${process.env.FRONTEND_URL}/dashboard?payment=success`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/pricing?payment=cancelled`,
    metadata: { userId: userId.toString() },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  });
  return session;
};

const createPortalSession = async ({ customerId }) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.FRONTEND_URL}/dashboard`,
  });
  return session;
};

const cancelSubscription = async (subscriptionId) => {
  return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
};

const constructWebhookEvent = (payload, signature) => {
  return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
};

const getSubscription = async (subscriptionId) => {
  return stripe.subscriptions.retrieve(subscriptionId);
};

module.exports = {
  PLANS,
  getPlans,
  createCustomer,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  constructWebhookEvent,
  getSubscription,
};
