import { useCallback, useMemo, useRef, useState } from 'react'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { getCheckoutApiBase } from '../utils/getCheckoutApiBase'
import { usePilotSafety } from '../context/PilotSafetyContext'

interface StartCheckoutOptions {
  priceId?: string
  quantity?: number
  metadata?: Record<string, string | number | boolean | null | undefined>
  lineItems?: Array<{ price: string; quantity?: number }>
  customerEmail?: string
  successUrl?: string
  cancelUrl?: string
}

interface UseStripeCheckoutOptions {
  defaultPriceId?: string
}

interface CheckoutResult {
  ok: boolean
  error?: string
}

export function useStripeCheckout(options?: UseStripeCheckoutOptions) {
  const publishableKey = useMemo(() => import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim(), [])
  const [loading, setLoading] = useState(false)
  const stripePromiseRef = useRef<Promise<Stripe | null> | null>(null)
  const { logTelemetry } = usePilotSafety()

  const ensureStripe = useCallback(async () => {
    if (!publishableKey) {
      throw new Error('Missing Stripe publishable key. Set VITE_STRIPE_PUBLISHABLE_KEY in your env file.')
    }

    if (!stripePromiseRef.current) {
      stripePromiseRef.current = loadStripe(publishableKey)
    }

    const stripe = await stripePromiseRef.current
    if (!stripe) {
      stripePromiseRef.current = null
      throw new Error('Stripe.js failed to initialize.')
    }

    return stripe
  }, [publishableKey])

  const launchCheckout = useCallback(
    async (input?: StartCheckoutOptions): Promise<CheckoutResult> => {
      if (!publishableKey) {
        return { ok: false, error: 'Stripe publishable key is missing. Configure VITE_STRIPE_PUBLISHABLE_KEY first.' }
      }

      const priceId = input?.priceId ?? options?.defaultPriceId
      const quantity = input?.quantity ?? 1
      const hasExplicitLineItems = Array.isArray(input?.lineItems) && input?.lineItems.length > 0

      if (!priceId && !hasExplicitLineItems) {
        return { ok: false, error: 'No Stripe price configured for checkout.' }
      }

      try {
        setLoading(true)
        logTelemetry('checkout_session_requested', {
          priceConfigured: Boolean(priceId),
          quantity,
        })

        const payload: Record<string, unknown> = {
          metadata: input?.metadata,
          quantity,
          successUrl: input?.successUrl,
          cancelUrl: input?.cancelUrl,
          customerEmail: input?.customerEmail,
        }

        if (priceId) {
          payload.priceId = priceId
        }
        if (hasExplicitLineItems && input?.lineItems) {
          payload.lineItems = input.lineItems
        }

        const response = await fetch(`${getCheckoutApiBase()}/api/stripe/checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          credentials: 'include',
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Backend failed to create a checkout session.')
        }

        const data = (await response.json()) as { sessionId?: string; url?: string }

        if (data.sessionId) {
          const stripe = await ensureStripe()
          const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId })
          if (error) {
            throw new Error(error.message || 'Stripe redirect failed.')
          }
        } else if (data.url) {
          window.location.assign(data.url)
        } else {
          throw new Error('Backend did not return a session identifier.')
        }

        logTelemetry('checkout_session_redirected', {
          priceConfigured: Boolean(priceId),
          quantity,
        })
        return { ok: true }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to start checkout.'
        logTelemetry('checkout_session_error', { message: message.slice(0, 100) })
        return { ok: false, error: message }
      } finally {
        setLoading(false)
      }
    },
    [ensureStripe, logTelemetry, options?.defaultPriceId, publishableKey]
  )

  return {
    launchCheckout,
    loading,
    ready: Boolean(publishableKey),
    missingPublishableKey: !publishableKey,
  }
}
