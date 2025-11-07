import { sha512_256 } from 'js-sha512'

export type PilotTelemetryStatus = 'queued' | 'sent' | 'failed' | 'disabled'

export interface PilotTelemetryEnvelope {
  id: string
  name: string
  status: PilotTelemetryStatus
  timestamp: number
  metadata?: Record<string, string>
  attempts: number
}

export interface PilotTelemetryContext {
  walletId?: string
  network?: string
  addressHash?: string
  guardReady?: boolean
  sessionId: string
}

interface PilotTelemetryEventInput {
  name: string
  metadata?: Record<string, string | number | boolean | null | undefined>
}

const TELEMETRY_EVENT = 'pilot-telemetry'
const TELEMETRY_STATUS_EVENT = 'pilot-telemetry-status'
const TELEMETRY_STORAGE_KEY = 'pilot-telemetry-session'

const telemetryEndpoint = import.meta.env.VITE_PILOT_TELEMETRY_ENDPOINT?.trim()
const telemetryEnabled = Boolean(telemetryEndpoint)

const telemetryContext: PilotTelemetryContext = {
  sessionId: resolveSessionId(),
}

const telemetryQueue: PilotTelemetryEnvelope[] = []
const telemetryBuffer: PilotTelemetryEnvelope[] = []

const MAX_BUFFER_SIZE = 20
const MAX_ATTEMPTS = 5

let flushTimeout: number | undefined
let retryTimeout: number | undefined
let flushInFlight = false
let lifecycleBound = false

export function hashIdentifier(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined
  }
  try {
    return sha512_256(value).slice(0, 24)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Unable to hash identifier for telemetry bridge.', error)
  }
  return undefined
}

function resolveSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server'
  }

  try {
    const existing = window.sessionStorage.getItem(TELEMETRY_STORAGE_KEY)
    if (existing) {
      return existing
    }
  } catch {
    // sessionStorage might not be available (privacy mode); fall through to random id
  }

  const randomId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sess-${Math.random().toString(36).slice(2)}`

  try {
    window.sessionStorage.setItem(TELEMETRY_STORAGE_KEY, randomId)
  } catch {
    // ignore storage errors
  }

  return randomId
}

function broadcastEnvelope(envelopes: PilotTelemetryEnvelope[], type: 'append' | 'status') {
  if (typeof window === 'undefined') {
    return
  }

  const eventName = type === 'append' ? TELEMETRY_EVENT : TELEMETRY_STATUS_EVENT
  window.dispatchEvent(new CustomEvent(eventName, { detail: envelopes.map((entry) => ({ ...entry })) }))
}

function sanitizeMetadata(raw?: Record<string, string | number | boolean | null | undefined>): Record<string, string> | undefined {
  if (!raw) {
    return undefined
  }

  const sanitizedEntries = Object.entries(raw).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value === undefined) {
      return acc
    }

    if (value === null) {
      acc[key] = 'null'
      return acc
    }

    if (typeof value === 'boolean') {
      acc[key] = value ? 'true' : 'false'
      return acc
    }

    if (typeof value === 'number') {
      acc[key] = Number.isFinite(value) ? String(value) : 'NaN'
      return acc
    }

    acc[key] = String(value)
    return acc
  }, {})

  return Object.keys(sanitizedEntries).length > 0 ? sanitizedEntries : undefined
}

function queueEnvelope(envelope: PilotTelemetryEnvelope) {
  telemetryQueue.push(envelope)
  telemetryBuffer.unshift(envelope)
  if (telemetryBuffer.length > MAX_BUFFER_SIZE) {
    telemetryBuffer.pop()
  }
  broadcastEnvelope([envelope], 'append')
  bindLifecycle()
  scheduleFlush()
}

function scheduleFlush() {
  if (!telemetryEnabled) {
    return
  }

  if (typeof window === 'undefined') {
    return
  }

  if (flushTimeout || flushInFlight) {
    return
  }

  flushTimeout = window.setTimeout(() => {
    flushTimeout = undefined
    void flushQueue()
  }, 1000)
}

function scheduleRetry() {
  if (!telemetryEnabled || typeof window === 'undefined') {
    return
  }

  if (retryTimeout || telemetryQueue.length === 0) {
    return
  }

  const maxAttempts = telemetryQueue.reduce((max, envelope) => Math.max(max, envelope.attempts), 0)
  const backoff = Math.min(1000 * 2 ** maxAttempts, 10000)

  retryTimeout = window.setTimeout(() => {
    retryTimeout = undefined
    scheduleFlush()
  }, backoff)
}

async function flushQueue(options: { useBeacon?: boolean } = {}) {
  if (!telemetryEnabled || telemetryQueue.length === 0 || typeof window === 'undefined' || flushInFlight) {
    return
  }

  flushInFlight = true
  const batch = telemetryQueue.splice(0, telemetryQueue.length)
  const payload = batch.map((envelope) => ({
    id: envelope.id,
    name: envelope.name,
    timestamp: envelope.timestamp,
    context: telemetryContext,
    metadata: envelope.metadata,
  }))

  try {
    const requestBody = JSON.stringify({ events: payload })
    let success = false

    if (options.useBeacon && navigator?.sendBeacon) {
      const blob = new Blob([requestBody], { type: 'application/json' })
      success = navigator.sendBeacon(telemetryEndpoint!, blob)
    }

    if (!success) {
      const response = await fetch(telemetryEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
        keepalive: true,
      })
      success = response.ok
    }

    batch.forEach((envelope) => {
      envelope.status = success ? 'sent' : 'failed'
    })
    broadcastEnvelope(batch, 'status')
    if (!success) {
      batch.forEach((envelope) => {
        envelope.attempts += 1
        if (envelope.attempts < MAX_ATTEMPTS) {
          envelope.status = 'queued'
          telemetryQueue.unshift(envelope)
        }
      })
      scheduleRetry()
    }
  } catch (error) {
    batch.forEach((envelope) => {
      envelope.status = 'failed'
      envelope.attempts += 1
      if (envelope.attempts < MAX_ATTEMPTS) {
        envelope.status = 'queued'
        telemetryQueue.unshift(envelope)
      }
    })
    broadcastEnvelope(batch, 'status')
    scheduleRetry()
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('Pilot telemetry flush failed', error)
    }
  } finally {
    flushInFlight = false
  }
}

export function getTelemetryBuffer(): PilotTelemetryEnvelope[] {
  return telemetryBuffer.map((entry) => ({ ...entry }))
}

export function setTelemetryContext(partial: Partial<PilotTelemetryContext>) {
  Object.assign(telemetryContext, partial)
}

export function initTelemetryBridge() {
  bindLifecycle()
}

export function flushTelemetryNow(options?: { useBeacon?: boolean }) {
  if (!telemetryEnabled || typeof window === 'undefined') {
    return
  }
  void flushQueue(options)
}

export function recordTelemetryEvent(input: PilotTelemetryEventInput): PilotTelemetryEnvelope {
  const metadata = sanitizeMetadata(input.metadata)

  const envelope: PilotTelemetryEnvelope = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name: input.name,
    status: telemetryEnabled ? 'queued' : 'disabled',
    timestamp: Date.now(),
    metadata,
    attempts: 0,
  }

  if (!telemetryEnabled) {
    telemetryBuffer.unshift(envelope)
    if (telemetryBuffer.length > MAX_BUFFER_SIZE) {
      telemetryBuffer.pop()
    }
    broadcastEnvelope([envelope], 'append')
    return envelope
  }

  queueEnvelope(envelope)
  return envelope
}

function bindLifecycle() {
  if (lifecycleBound || typeof window === 'undefined') {
    return
  }

  lifecycleBound = true

  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') {
      flushTelemetryNow({ useBeacon: true })
    }
  }

  const handlePageHide = () => {
    flushTelemetryNow({ useBeacon: true })
  }

  const handleOnline = () => {
    scheduleFlush()
  }

  window.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('pagehide', handlePageHide)
  window.addEventListener('beforeunload', handlePageHide)
  window.addEventListener('online', handleOnline)
}
