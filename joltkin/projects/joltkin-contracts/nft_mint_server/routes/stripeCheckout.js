const express = require('express')
const router = express.Router()

const { getCheckoutRedirects } = require('../lib/config')
const { getStripeClient } = require('../lib/stripeClient')

router.post('/checkout-session', async (req, res) => {
  const stripe = getStripeClient()
  const { priceId, quantity = 1, metadata = {}, successUrl, cancelUrl, lineItems, customerEmail } = req.body || {}

  if (!priceId && !Array.isArray(lineItems)) {
    return res.status(400).json({ error: 'Provide a priceId or a pre-built lineItems array.' })
  }

  if (priceId && quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be 1 or greater.' })
  }

  try {
    const redirects = getCheckoutRedirects()
    const sessionPayload = {
      mode: 'payment',
      success_url: successUrl || redirects.successUrl,
      cancel_url: cancelUrl || redirects.cancelUrl,
      payment_method_types: ['card'],
      metadata,
      line_items: Array.isArray(lineItems) && lineItems.length > 0 ? lineItems : [{ price: priceId, quantity }],
    }

    if (customerEmail) {
      sessionPayload.customer_email = customerEmail
    }

    const session = await stripe.checkout.sessions.create(sessionPayload)

    res.status(200).json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Stripe checkout session error:', {
      message: error?.message,
      type: error?.type,
      statusCode: error?.statusCode,
    })
    res.status(500).json({ error: 'Unable to create Stripe Checkout Session.' })
  }
})

module.exports = router
