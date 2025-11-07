import { useMemo } from 'react'
import { trackPilotEvent } from '../utils/pilotAnalytics'

interface PilotWarningOverlayProps {
  visible: boolean
  onDismiss: () => void
}

const SUPPORT_EMAIL = 'justinh@alumni.harvard.edu'

export function PilotWarningOverlay({ visible, onDismiss }: PilotWarningOverlayProps) {
  const overlayClass = useMemo(() => {
    return visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
  }, [visible])

  if (!visible) {
    return null
  }

  const handleContact = () => {
    trackPilotEvent({
      name: 'mnemonic_guard_contact',
      metadata: {
        channel: 'email',
      },
    })
  }

  const handleAcknowledge = () => {
    trackPilotEvent({
      name: 'mnemonic_guard_acknowledged',
    })
    onDismiss()
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-all duration-200 ${overlayClass}`}
      role="alertdialog"
      aria-live="assertive"
    >
      <div className="max-w-lg rounded-3xl border border-amber-400/40 bg-slate-900/95 p-8 shadow-2xl">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">Pilot safeguard</p>
          <h2 className="text-2xl font-semibold text-slate-100">Mnemonic guard missing</h2>
          <p className="text-sm text-slate-300">
            The connected wallet does not expose a mnemonic guard. Mnemonic guards keep the recovery phrase sealed away so a stolen laptop
            cannot empty event funds. For the Algorand pilot run we require guard coverage before allowing door operations or settlement
            exports. Email the pilot desk and we will activate a manual override once your guard is in place.
          </p>
        </header>

        <div className="mt-6 space-y-3">
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Mnemonic%20Guard%20Override%20Request`}
            onClick={handleContact}
            className="flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/30 transition hover:shadow-[0_0_25px_rgba(250,204,21,0.35)]"
          >
            Contact pilot desk
          </a>
          <button
            type="button"
            onClick={handleAcknowledge}
            className="w-full rounded-full border border-slate-700/70 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
          >
            I understand — will add guard
          </button>
        </div>
      </div>
    </div>
  )
}

export default PilotWarningOverlay
