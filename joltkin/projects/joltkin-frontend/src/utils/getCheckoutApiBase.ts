import { resolveCheckoutApiBase } from './resolveCheckoutApiBase'

export function getCheckoutApiBase(): string {
  const explicit = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_CHECKOUT_API_BASE : undefined
  const location = typeof window !== 'undefined' ? window.location : undefined
  return resolveCheckoutApiBase({ explicitBase: explicit, location })
}
