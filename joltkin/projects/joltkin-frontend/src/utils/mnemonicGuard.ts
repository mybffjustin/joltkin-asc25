import { Wallet, WalletId } from '@txnlab/use-wallet-react'

interface EnvWindow {
  VITE_PILOT_GUARD_ALLOWLIST?: string
  VITE_PILOT_REQUIRE_GUARD?: string
}

interface WalletMetadataWithFeatures {
  features?: unknown
  [key: string]: unknown
}

export interface MnemonicGuardReport {
  ready: boolean
  reason?: string
  source: 'allowlist' | 'metadata' | 'wallet-id' | 'disabled' | 'unknown'
  walletId?: WalletId | string
}

const DEFAULT_ALLOWLIST: Array<WalletId | string> = [WalletId.PERA, WalletId.DEFLY, WalletId.EXODUS, WalletId.LUTE]

const envWindow = import.meta.env as unknown as EnvWindow

const parsedAllowlist = (() => {
  const envValue = envWindow.VITE_PILOT_GUARD_ALLOWLIST?.trim()
  if (!envValue) {
    return []
  }
  return envValue
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
})()

const guardAllowlist = new Set<string>([...DEFAULT_ALLOWLIST.map(String), ...parsedAllowlist])

const guardRequired = (() => {
  const raw = envWindow.VITE_PILOT_REQUIRE_GUARD
  if (typeof raw === 'string' && raw.toLowerCase() === 'false') {
    return false
  }
  return true
})()

function hasFeatureFlag(metadata: WalletMetadataWithFeatures, keyword: string): boolean {
  const featureList = metadata.features
  if (!featureList) {
    return false
  }

  if (Array.isArray(featureList)) {
    return featureList.some((entry) => {
      if (typeof entry !== 'string') {
        return false
      }
      return entry.toLowerCase().includes(keyword)
    })
  }

  if (typeof featureList === 'object') {
    return Object.keys(featureList).some((key) => {
      return key.toLowerCase().includes(keyword) && Boolean((featureList as Record<string, unknown>)[key])
    })
  }

  return false
}

export function detectMnemonicGuard(wallet: Wallet | undefined): MnemonicGuardReport {
  if (!guardRequired) {
    return { ready: true, reason: 'Mnemonic guard requirement disabled via env flag.', source: 'disabled', walletId: wallet?.id }
  }

  if (!wallet) {
    return { ready: false, reason: 'No wallet session detected yet.', source: 'unknown' }
  }

  if (wallet.id === WalletId.KMD) {
    return {
      ready: true,
      reason: 'Local development wallet assumed to run inside sealed dev environment.',
      source: 'wallet-id',
      walletId: wallet.id,
    }
  }

  if (guardAllowlist.has(String(wallet.id))) {
    return { ready: true, reason: 'Wallet is on the approved mnemonic guard list.', source: 'allowlist', walletId: wallet.id }
  }

  const metadata = (wallet.metadata ?? {}) as WalletMetadataWithFeatures
  if (hasFeatureFlag(metadata, 'mnemonic') || hasFeatureFlag(metadata, 'passphrase')) {
    return { ready: true, reason: 'Wallet metadata advertises mnemonic guard support.', source: 'metadata', walletId: wallet.id }
  }

  if (metadata?.name && guardAllowlist.has(String(metadata.name))) {
    return { ready: true, reason: 'Wallet name matches guard allowlist.', source: 'allowlist', walletId: wallet.id }
  }

  return {
    ready: false,
    reason: 'Wallet provider has not been cleared for mnemonic guard coverage yet.',
    source: 'unknown',
    walletId: wallet.id,
  }
}
