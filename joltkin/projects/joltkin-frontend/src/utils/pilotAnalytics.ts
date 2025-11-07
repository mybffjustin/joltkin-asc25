type PilotEventName =
  | 'overlay_viewed'
  | 'mnemonic_guard_contact'
  | 'mnemonic_guard_acknowledged'
  | 'mnemonic_guard_ready'
  | 'mnemonic_guard_blocked'
  | 'pilot_action_allowed'

export interface PilotEvent {
  name: PilotEventName
  timestamp: number
  metadata?: Record<string, string>
}

const runtimeEvents: PilotEvent[] = []

export function trackPilotEvent(event: Omit<PilotEvent, 'timestamp'>) {
  const enrichedEvent: PilotEvent = {
    ...event,
    timestamp: Date.now(),
  }

  runtimeEvents.push(enrichedEvent)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<PilotEvent>('pilot-analytics', { detail: enrichedEvent }))
  }

  if (import.meta.env.DEV) {
    // Developers want quick confirmation while wiring the pilot route.
    // eslint-disable-next-line no-console
    console.debug('[pilot-analytics]', enrichedEvent)
  }
}

export function getPilotEvents(): PilotEvent[] {
  return [...runtimeEvents]
}
