const Stripe = require('stripe')
const { getStripeSecretKey } = require('./config')

let stripeInstance

function getStripeClient() {
  if (!stripeInstance) {
    const secretKey = getStripeSecretKey()
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-04-10',
    })
  }
  return stripeInstance
}

module.exports = { getStripeClient }
