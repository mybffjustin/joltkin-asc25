function readEnv(key) {
  const raw = process.env[key]
  if (typeof raw !== 'string') {
    return undefined
  }
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const DEFAULT_FRONTEND_BASE_URL = readEnv('FRONTEND_BASE_URL') || 'http://localhost:5173'
const DEFAULT_SUCCESS_URL =
  readEnv('CHECKOUT_SUCCESS_URL') || `${DEFAULT_FRONTEND_BASE_URL.replace(/\/$/, '')}/?checkout=success`
const DEFAULT_CANCEL_URL =
  readEnv('CHECKOUT_CANCEL_URL') || `${DEFAULT_FRONTEND_BASE_URL.replace(/\/$/, '')}/?checkout=cancel`

function getStripeSecretKey() {
  const secret = readEnv('STRIPE_SECRET_KEY')
  if (!secret) {
    throw new Error('Missing STRIPE_SECRET_KEY. Copy .env.template and set your Stripe test secret key.')
  }
  return secret
}

function getStripeWebhookSecret() {
  return readEnv('STRIPE_WEBHOOK_SECRET')
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
