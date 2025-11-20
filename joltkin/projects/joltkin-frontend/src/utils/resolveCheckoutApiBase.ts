export interface LocationLike {
  host: string
  protocol: string
}

export type ResolveCheckoutOptions = {
  explicitBase?: string | null | undefined
  location?: LocationLike | null | undefined
}

export function getDefaultCheckoutBase(): string {
  return 'http://localhost:3001'
}

function sanitizeUrl(value: string): string {
  return value.replace(/\/$/, '')
}

export function resolveCheckoutApiBase(options?: ResolveCheckoutOptions) {
  const explicit = options?.explicitBase?.trim()
  if (explicit) {
    return sanitizeUrl(explicit)
  }

  const location = options?.location
  if (!location) {
    return getDefaultCheckoutBase()
  }

  const { host, protocol } = location

  if (/(\.preview)?\.app\.github\.dev$/.test(host)) {
    return `https://${host.replace(/-\d+(?:\.preview)?\.app\.github\.dev$/, '-3001.app.github.dev')}`
  }

  if (host.includes('localhost')) {
    return getDefaultCheckoutBase()
  }

  return `${protocol}//${host}`
}
