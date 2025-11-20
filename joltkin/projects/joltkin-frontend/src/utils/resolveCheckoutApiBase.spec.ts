import { resolveCheckoutApiBase } from './resolveCheckoutApiBase'

describe('resolveCheckoutApiBase', () => {
  it('prefers explicit env value when provided', () => {
    const result = resolveCheckoutApiBase({ explicitBase: 'https://example.com/api/' })
    expect(result).toBe('https://example.com/api')
  })

  it('coerces GitHub Codespaces hosts to port 3001', () => {
    const result = resolveCheckoutApiBase({
      location: {
        host: 'abc-5173.preview.app.github.dev',
        protocol: 'https:',
      },
    })
    expect(result).toBe('https://abc-3001.app.github.dev')
  })

  it('falls back to localhost:3001 when host includes localhost', () => {
    const result = resolveCheckoutApiBase({
      location: {
        host: 'localhost:4173',
        protocol: 'http:',
      },
    })
    expect(result).toBe('http://localhost:3001')
  })

  it('returns origin for production-style hosts', () => {
    const result = resolveCheckoutApiBase({
      location: {
        host: 'app.joltkin.com',
        protocol: 'https:',
      },
    })
    expect(result).toBe('https://app.joltkin.com')
  })
})
