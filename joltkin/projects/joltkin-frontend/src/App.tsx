import { useMemo } from 'react'
import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import Home from './Home'
import PilotControlCenter from './PilotControlCenter'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import { PilotSafetyProvider } from './context/PilotSafetyContext'

let supportedWallets: SupportedWallet[]
if (import.meta.env.VITE_ALGOD_NETWORK === 'localnet') {
  const kmdConfig = getKmdConfigFromViteEnvironment()
  supportedWallets = [
    {
      id: WalletId.KMD,
      options: {
        baseServer: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
  ]
} else {
  supportedWallets = [
    { id: WalletId.DEFLY },
    { id: WalletId.PERA },
    { id: WalletId.EXODUS },
    { id: WalletId.LUTE },
    // If you are interested in WalletConnect v2 provider
    // refer to https://github.com/TxnLab/use-wallet for detailed integration instructions
  ]
}

export default function App() {
  const algodConfig = getAlgodConfigFromViteEnvironment()

  const walletManager = useMemo(() => {
    return new WalletManager({
      wallets: supportedWallets,
      defaultNetwork: algodConfig.network,
      networks: {
        [algodConfig.network]: {
          algod: {
            baseServer: algodConfig.server,
            port: algodConfig.port,
            token: String(algodConfig.token),
          },
        },
      },
      options: {
        resetNetwork: true,
      },
    })
  }, [algodConfig.network, algodConfig.port, algodConfig.server, algodConfig.token])

  const isPilotRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/pilot-control-center')

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider manager={walletManager}>
        <PilotSafetyProvider>{isPilotRoute ? <PilotControlCenter /> : <Home />}</PilotSafetyProvider>
      </WalletProvider>
    </SnackbarProvider>
  )
}
