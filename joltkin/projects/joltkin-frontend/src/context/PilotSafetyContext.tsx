import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { detectMnemonicGuard, MnemonicGuardReport } from '../utils/mnemonicGuard'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { trackPilotEvent } from '../utils/pilotAnalytics'
import {
  hashIdentifier,
  initTelemetryBridge,
  recordTelemetryEvent,
  setTelemetryContext,
  PilotTelemetryEnvelope,
  getTelemetryBuffer,
} from '../utils/pilotTelemetryBridge'

interface PilotSafetyContextValue {
  mnemonicGuardReady: boolean
  guardReport: MnemonicGuardReport
  ensureMnemonicGuard: (actionName: string, metadata?: Record<string, string | number | boolean | null | undefined>) => boolean
  logTelemetry: (eventName: string, metadata?: Record<string, string | number | boolean | null | undefined>) => void
  telemetryStatus: PilotTelemetryEnvelope[]
}

const PilotSafetyContext = createContext<PilotSafetyContextValue | undefined>(undefined)

function resolveNetwork(): string {
  try {
    return getAlgodConfigFromViteEnvironment().network ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

function normalizedMetadata(metadata?: Record<string, string | number | boolean | null | undefined>): Record<string, string> | undefined {
  if (!metadata) {
    return undefined
  }

  const normalized: Record<string, string> = {}
  Object.entries(metadata).forEach(([key, value]) => {
    if (value === undefined) {
      return
    }
    if (value === null) {
      normalized[key] = 'null'
      return
    }
    if (typeof value === 'boolean') {
      normalized[key] = value ? 'true' : 'false'
      return
    }
    if (typeof value === 'number') {
      normalized[key] = Number.isFinite(value) ? String(value) : 'NaN'
      return
    }
    normalized[key] = String(value)
  })

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

export function PilotSafetyProvider({ children }: PropsWithChildren) {
  const network = useMemo(resolveNetwork, [])
  const { wallets, activeAddress } = useWallet()
  const [telemetryStatus, setTelemetryStatus] = useState<PilotTelemetryEnvelope[]>(() => getTelemetryBuffer())

  useEffect(() => {
    initTelemetryBridge()
  }, [])

  const activeWallet = useMemo(() => {
    if (!wallets) {
      return undefined
    }
    return wallets.find((wallet) => wallet.isActive)
  }, [wallets])

  const guardReport = useMemo(() => detectMnemonicGuard(activeWallet), [activeWallet])
  const guardReady = guardReport.ready

  const previousGuardRef = useRef<boolean>(guardReady)

  useEffect(() => {
    const addressHash = hashIdentifier(activeAddress)
    setTelemetryContext({
      walletId: activeWallet?.id,
      addressHash,
      network,
      guardReady,
    })
  }, [activeWallet?.id, activeAddress, network, guardReady])

  useEffect(() => {
    if (previousGuardRef.current === guardReady) {
      return
    }

    previousGuardRef.current = guardReady

    if (guardReady) {
      trackPilotEvent({
        name: 'mnemonic_guard_ready',
        metadata: guardReport.source ? { source: guardReport.source } : undefined,
      })
      recordTelemetryEvent({
        name: 'mnemonic_guard_ready',
        metadata: guardReport.source ? { source: guardReport.source } : undefined,
      })
    }
  }, [guardReady, guardReport.source])

  useEffect(() => {
    const handleAppend = (event: Event) => {
      const custom = event as CustomEvent<PilotTelemetryEnvelope[]>
      setTelemetryStatus((current) => {
        const combined = [...custom.detail, ...current]
        const deduped = combined
          .filter((value, index, arr) => index === arr.findIndex((candidate) => candidate.id === value.id))
          .slice(0, 20)
        return deduped
      })
    }

    const handleStatus = (event: Event) => {
      const custom = event as CustomEvent<PilotTelemetryEnvelope[]>
      setTelemetryStatus((current) => {
        const statusMap = new Map(custom.detail.map((entry) => [entry.id, entry.status]))
        return current.map((entry) => {
          const newStatus = statusMap.get(entry.id)
          if (!newStatus) {
            return entry
          }
          return { ...entry, status: newStatus }
        })
      })
    }

    window.addEventListener('pilot-telemetry', handleAppend)
    window.addEventListener('pilot-telemetry-status', handleStatus)
    return () => {
      window.removeEventListener('pilot-telemetry', handleAppend)
      window.removeEventListener('pilot-telemetry-status', handleStatus)
    }
  }, [])

  const ensureMnemonicGuard = (actionName: string, metadata?: Record<string, string | number | boolean | null | undefined>) => {
    if (guardReady) {
      const sanitized: Record<string, string> = normalizedMetadata(metadata) ?? {}
      trackPilotEvent({ name: 'pilot_action_allowed', metadata: { action: actionName, ...sanitized } })
      recordTelemetryEvent({ name: 'pilot_action_allowed', metadata: { action: actionName, ...sanitized } })
      return true
    }

    const combinedMetadata: Record<string, string> = normalizedMetadata(metadata) ?? {}
    combinedMetadata.action = actionName
    combinedMetadata.wallet = activeWallet?.id ?? 'unknown'
    if (guardReport.reason) {
      combinedMetadata.reason = guardReport.reason
    }

    trackPilotEvent({ name: 'mnemonic_guard_blocked', metadata: combinedMetadata })
    recordTelemetryEvent({ name: 'mnemonic_guard_blocked', metadata: combinedMetadata })
    return false
  }

  const logTelemetry = (eventName: string, metadata?: Record<string, string | number | boolean | null | undefined>) => {
    recordTelemetryEvent({ name: eventName, metadata: normalizedMetadata(metadata) })
  }

  const value = useMemo<PilotSafetyContextValue>(() => {
    return {
      mnemonicGuardReady: guardReady,
      guardReport,
      ensureMnemonicGuard,
      logTelemetry,
      telemetryStatus,
    }
  }, [ensureMnemonicGuard, guardReady, guardReport, logTelemetry, telemetryStatus])

  return <PilotSafetyContext.Provider value={value}>{children}</PilotSafetyContext.Provider>
}

export function usePilotSafety(): PilotSafetyContextValue {
  const context = useContext(PilotSafetyContext)
  if (!context) {
    throw new Error('usePilotSafety must be used within a PilotSafetyProvider')
  }
  return context
}
