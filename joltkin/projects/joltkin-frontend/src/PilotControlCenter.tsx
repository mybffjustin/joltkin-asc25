import { useEffect, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AiOutlineCheckCircle, AiOutlineClose, AiOutlineWarning } from 'react-icons/ai'
import PilotWarningOverlay from './components/PilotWarningOverlay'
import { getPilotEvents, PilotEvent, trackPilotEvent } from './utils/pilotAnalytics'
import { usePilotSafety } from './context/PilotSafetyContext'

const readinessCopy = {
  ready: {
    tone: 'text-emerald-300',
    label: 'Ready',
  },
  actionNeeded: {
    tone: 'text-amber-300',
    label: 'Action needed',
  },
}

export default function PilotControlCenter() {
  const { activeAddress } = useWallet()
  const { mnemonicGuardReady, guardReport, telemetryStatus } = usePilotSafety()
  const [overlayDismissed, setOverlayDismissed] = useState(false)
  const [overlayLogged, setOverlayLogged] = useState(false)
  const [pilotEvents, setPilotEvents] = useState<PilotEvent[]>(() => getPilotEvents().slice(-5).reverse())

  const shouldShowOverlay = !overlayDismissed && !mnemonicGuardReady

  useEffect(() => {
    if (shouldShowOverlay && !overlayLogged) {
      trackPilotEvent({ name: 'overlay_viewed' })
      setOverlayLogged(true)
    }
  }, [overlayLogged, shouldShowOverlay])

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const customEvent = event as CustomEvent<PilotEvent>
      setPilotEvents((current) => {
        const next = [customEvent.detail, ...current]
        return next.slice(0, 5)
      })
    }

    window.addEventListener('pilot-analytics', handleEvent)
    return () => {
      window.removeEventListener('pilot-analytics', handleEvent)
    }
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const handleClose = () => {
    if (typeof window === 'undefined') {
      return
    }

    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.assign('/')
    }
  }

  const readiness = [
    {
      title: 'Wallet connected',
      status: activeAddress ? readinessCopy.ready : readinessCopy.actionNeeded,
      detail: activeAddress ? 'Address present — wallet session active.' : 'No wallet session detected. Connect before pilot run.',
    },
    {
      title: 'Mnemonic guard',
      status: mnemonicGuardReady ? readinessCopy.ready : readinessCopy.actionNeeded,
      detail: mnemonicGuardReady
        ? 'Guard detected. Door operations can proceed.'
        : (guardReport.reason ?? 'Guard missing. Complete guard setup or request override.'),
    },
    {
      title: 'Telemetry bridge',
      status:
        telemetryStatus.length === 0
          ? readinessCopy.actionNeeded
          : telemetryStatus[0].status === 'failed'
            ? readinessCopy.actionNeeded
            : readinessCopy.ready,
      detail:
        telemetryStatus.length === 0
          ? 'Telemetry idle. Events appear once you interact with the pilot flows.'
          : telemetryStatus[0].status === 'failed'
            ? 'Recent telemetry failed to send — verify endpoint availability.'
            : telemetryStatus[0].status === 'disabled'
              ? 'Telemetry endpoint disabled; events remain local for privacy.'
              : 'Telemetry events transmitting. Check recent log below for confirmation.',
    },
  ]

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-slate-950/85 px-4 py-10 text-slate-100 backdrop-blur">
      <PilotWarningOverlay visible={shouldShowOverlay} onDismiss={() => setOverlayDismissed(true)} />

      <div
        className="relative z-40 flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/90 shadow-[0_0_60px_rgba(15,23,42,0.75)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pilot-center-title"
      >
        <header className="flex items-start justify-between gap-6 border-b border-slate-800/60 bg-slate-900/95 px-8 py-7">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-rose-200/70">Pilot control center</p>
            <h1 id="pilot-center-title" className="text-3xl font-semibold text-slate-50">
              Runtime readiness dashboard
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Verify pilot safeguards, confirm telemetry flow, and capture guard confirmations without leaving your current session.
              Everything in this panel updates live as you interact with the Harvard demo flows.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-slate-700/70 bg-slate-900/80 p-2 text-slate-400 transition hover:text-slate-100"
            aria-label="Close pilot control center"
          >
            <AiOutlineClose size={22} />
          </button>
        </header>

        <div className="flex max-h-[75vh] flex-col gap-6 overflow-y-auto px-8 py-7">
          <section className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-inner shadow-slate-950/40">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/70">Quick status sweep</h2>
            <p className="mt-2 text-sm text-slate-300">
              Resolve any amber items before the pilot. Tap into the wallet or guard provider directly from this summary.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {readiness.map((check) => (
                <article
                  key={check.title}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/80 p-4 shadow-md shadow-slate-950/30"
                >
                  <div className="flex items-center gap-3">
                    <span className={`${check.status.tone}`}>
                      {check.status.label === readinessCopy.ready.label ? (
                        <AiOutlineCheckCircle size={22} />
                      ) : (
                        <AiOutlineWarning size={22} />
                      )}
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-rose-200/70">{check.title}</p>
                      <p className={`text-base font-semibold ${check.status.tone}`}>{check.status.label}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300">{check.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-inner shadow-slate-950/40">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-rose-200/70">Manual override desk</p>
                <h2 className="text-2xl font-semibold text-slate-100">Contact protocol</h2>
              </div>
              <a
                href="mailto:justinh@alumni.harvard.edu?subject=Pilot%20Override%20Request"
                className="rounded-full border border-rose-400/60 px-5 py-2 text-sm font-semibold text-rose-200 transition hover:border-rose-300 hover:text-rose-100"
              >
                Email pilot desk
              </a>
            </header>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3">
                Confirm mnemonic guard coverage or request an override ticket with proof of guard deployment.
              </li>
              <li className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3">
                Share wallet provider, active address, and expected action timeline so the desk can stage monitoring hooks.
              </li>
              <li className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3">
                Wait for the green-light code before triggering doors, settlement exports, or token mints.
              </li>
            </ul>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-inner shadow-slate-950/40">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-rose-200/70">Runtime analytics</p>
                  <h2 className="text-xl font-semibold text-slate-100">Recent pilot events</h2>
                </div>
              </header>
              {pilotEvents.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">No runtime analytics recorded yet. Actions in this view will appear here.</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {pilotEvents.map((event) => (
                    <li
                      key={`${event.name}-${event.timestamp}`}
                      className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3"
                    >
                      <span className="font-semibold text-rose-200">{event.name}</span>
                      <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-inner shadow-slate-950/40">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-rose-200/70">Telemetry bridge</p>
                  <h2 className="text-xl font-semibold text-slate-100">Recent transmissions</h2>
                </div>
              </header>
              {telemetryStatus.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">Interact with settlement or mint flows to queue telemetry events.</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {telemetryStatus.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-rose-200">{entry.name}</span>
                        {entry.metadata && (
                          <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
                            {Object.entries(entry.metadata)
                              .map(([key, value]) => `${key}:${value}`)
                              .join(' • ')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        {entry.status.toUpperCase()} • {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
