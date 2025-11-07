/* eslint-disable no-console -- warn when falling back to baked-in defaults so the pilot can still boot */
import { AlgoViteClientConfig, AlgoViteKMDConfig } from '../../interfaces/network'

const TESTNET_DEFAULTS: Readonly<AlgoViteClientConfig> = Object.freeze({
  server: 'https://testnet-api.algonode.cloud',
  port: '',
  token: '',
  network: 'testnet',
})

const TESTNET_INDEXER_DEFAULTS: Readonly<AlgoViteClientConfig> = Object.freeze({
  server: 'https://testnet-idx.algonode.cloud',
  port: '',
  token: '',
  network: 'testnet',
})

export function getAlgodConfigFromViteEnvironment(): AlgoViteClientConfig {
  const server = import.meta.env.VITE_ALGOD_SERVER || TESTNET_DEFAULTS.server
  const port = import.meta.env.VITE_ALGOD_PORT || TESTNET_DEFAULTS.port
  const token = import.meta.env.VITE_ALGOD_TOKEN || TESTNET_DEFAULTS.token
  const network = import.meta.env.VITE_ALGOD_NETWORK || TESTNET_DEFAULTS.network

  if (!import.meta.env.VITE_ALGOD_SERVER) {
    console.warn('[pilot-network] Falling back to Algonode TestNet defaults for Algod client configuration.')
  }

  return { server, port, token, network }
}

export function getIndexerConfigFromViteEnvironment(): AlgoViteClientConfig {
  const server = import.meta.env.VITE_INDEXER_SERVER || TESTNET_INDEXER_DEFAULTS.server
  const port = import.meta.env.VITE_INDEXER_PORT || TESTNET_INDEXER_DEFAULTS.port
  const token = import.meta.env.VITE_INDEXER_TOKEN || TESTNET_INDEXER_DEFAULTS.token
  const network = import.meta.env.VITE_ALGOD_NETWORK || TESTNET_INDEXER_DEFAULTS.network

  if (!import.meta.env.VITE_INDEXER_SERVER) {
    console.warn('[pilot-network] Falling back to Algonode TestNet defaults for Indexer client configuration.')
  }

  return { server, port, token, network }
}

export function getKmdConfigFromViteEnvironment(): AlgoViteKMDConfig {
  if (!import.meta.env.VITE_KMD_SERVER) {
    throw new Error('Attempt to get default kmd configuration without specifying VITE_KMD_SERVER in the environment variables')
  }

  return {
    server: import.meta.env.VITE_KMD_SERVER,
    port: import.meta.env.VITE_KMD_PORT,
    token: import.meta.env.VITE_KMD_TOKEN,
    wallet: import.meta.env.VITE_KMD_WALLET,
    password: import.meta.env.VITE_KMD_PASSWORD,
  }
}
