const DEFAULT_FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173'
const DEFAULT_SUCCESS_URL =
  process.env.CHECKOUT_SUCCESS_URL || `${DEFAULT_FRONTEND_BASE_URL.replace(/\/$/, '')}/?checkout=success`
const DEFAULT_CANCEL_URL =
  process.env.CHECKOUT_CANCEL_URL || `${DEFAULT_FRONTEND_BASE_URL.replace(/\/$/, '')}/?checkout=cancel`

function getStripeSecretKey() {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    throw new Error('Missing STRIPE_SECRET_KEY. Copy .env.template and set your Stripe test secret key.')
  }
  return secret
}

function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET
}

function getCheckoutRedirects() {
  return {
    successUrl: DEFAULT_SUCCESS_URL,
    cancelUrl: DEFAULT_CANCEL_URL,
  }
}

module.exports = {
  getStripeSecretKey,
  getStripeWebhookSecret,
  getCheckoutRedirects,
}
