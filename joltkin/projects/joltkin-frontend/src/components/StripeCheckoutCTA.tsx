import { AiOutlineQrcode } from 'react-icons/ai'
import { BsCreditCard2Front, BsArrowRightShort } from 'react-icons/bs'
import { useMemo } from 'react'
import { useSnackbar } from 'notistack'
import { useStripeCheckout } from '../hooks/useStripeCheckout'

const PRICE_ENV = import.meta.env.VITE_STRIPE_PRICE_ID?.trim()

export function StripeCheckoutCTA() {
  const { enqueueSnackbar } = useSnackbar()
  const configuredPrice = useMemo(() => PRICE_ENV, [])
  const { launchCheckout, loading, missingPublishableKey } = useStripeCheckout({ defaultPriceId: configuredPrice })

  const disabled = loading || missingPublishableKey || !configuredPrice

  const statusLabel = useMemo(() => {
    if (missingPublishableKey) {
      return 'Add VITE_STRIPE_PUBLISHABLE_KEY to enable checkout.'
    }
    if (!configuredPrice) {
      return 'Set VITE_STRIPE_PRICE_ID (Stripe dashboard → Products) to sell tickets.'
    }
    return 'Stripe test mode • QR tickets auto-provisioned'
  }, [configuredPrice, missingPublishableKey])

  const handleCheckout = async () => {
    const result = await launchCheckout({
      metadata: {
        pilot: 'asc25',
        source: 'landing_cta',
      },
    })

    if (!result.ok && result.error) {
      enqueueSnackbar(result.error, { variant: 'error' })
    }
  }

  return (
    <div className="rounded-3xl border border-rose-500/50 bg-slate-950/70 p-6 shadow-lg shadow-rose-500/20">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-200">
          <AiOutlineQrcode className="text-2xl" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-rose-200/80">Ticketing Pilot</p>
          <h4 className="text-lg font-semibold text-slate-50">Run a Stripe checkout in test mode</h4>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-300">Launches a hosted Stripe Checkout session and returns a QR ticket for door scans.</p>
      <button
        type="button"
        disabled={disabled}
        onClick={handleCheckout}
        className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400 ${
          disabled
            ? 'cursor-not-allowed bg-slate-900/40 text-rose-200/40'
            : 'bg-gradient-to-r from-rose-500 via-red-500 to-amber-400 text-rose-50 hover:shadow-[0_0_25px_rgba(244,63,94,0.4)]'
        }`}
      >
        <BsCreditCard2Front className="text-base" />
        {loading ? 'Preparing Checkout…' : 'Sell Stripe Test Ticket'}
        <BsArrowRightShort className="text-xl" />
      </button>
      <p className="mt-3 text-xs text-rose-200/70">{statusLabel}</p>
    </div>
  )
}

export default StripeCheckoutCTA
