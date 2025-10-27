import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { encodeAddress } from 'algosdk'
import { ClearDealsFactory } from '../contracts/ClearDeals'
import { OnSchemaBreak, OnUpdate } from '@algorandfoundation/algokit-utils/types/app'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import type { SendSingleTransactionResult } from '@algorandfoundation/algokit-utils/types/transaction'

interface AppCallsInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

type WalletTransactionSigner = NonNullable<ReturnType<typeof useWallet>['transactionSigner']>

const randomSegment = (length: number) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const buffer = new Uint32Array(length)

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(buffer)
  } else {
    for (let i = 0; i < length; i += 1) {
      buffer[i] = Math.floor(Math.random() * alphabet.length)
    }
  }

  let segment = ''
  for (let i = 0; i < length; i += 1) {
    segment += alphabet[buffer[i] % alphabet.length]
  }
  return segment
}

const makeInvoiceId = () => `INV-JOLT-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}`

const resolveNative = <T,>(value: T | { native: T } | undefined): T | undefined => {
  if (value && typeof value === 'object' && 'native' in value) {
    return (value as { native: T }).native
  }
  return value as T | undefined
}

const ensureAppFunding = async (
  algorandClient: AlgorandClient,
  transactionSigner: WalletTransactionSigner,
  operatorAddress: string,
  appAddress: string,
  targetMicroAlgos: number | bigint = 500_000,
): Promise<SendSingleTransactionResult | undefined> => {
  const target = typeof targetMicroAlgos === 'bigint' ? targetMicroAlgos : BigInt(Math.round(targetMicroAlgos))

  try {
    const accountInfo = await algorandClient.client.algod.accountInformation(appAddress).do()
    const current = BigInt(accountInfo.amount ?? 0)
    if (current >= target) {
      return undefined
    }

    const deficit = target - current
    return algorandClient.send.payment({
      sender: operatorAddress,
      receiver: appAddress,
      amount: AlgoAmount.MicroAlgos(deficit),
      signer: transactionSigner,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`
    if (message.includes('account does not exist')) {
      return algorandClient.send.payment({
        sender: operatorAddress,
        receiver: appAddress,
        amount: AlgoAmount.MicroAlgos(target),
        signer: transactionSigner,
      })
    }
    throw error
  }
}

const AppCalls = ({ openModal, setModalState }: AppCallsInterface) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [invoiceId, setInvoiceId] = useState<string>(() => makeInvoiceId())
  const [payeeAddress, setPayeeAddress] = useState<string>('')
  const [amountAlgos, setAmountAlgos] = useState<string>('0.15')
  const [attestationCid, setAttestationCid] = useState<string>('bafy-jolt-demo-proof')
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({
    algodConfig,
    indexerConfig,
  })
  if (transactionSigner) {
    algorand.setDefaultSigner(transactionSigner)
  }

  const sendAppCall = async () => {
    if (!activeAddress) {
      enqueueSnackbar('Connect a wallet before logging settlements.', { variant: 'warning' })
      return
    }

    if (!transactionSigner) {
      enqueueSnackbar('Wallet signer not ready yet. Reconnect your wallet and try again.', { variant: 'warning' })
      return
    }

    if (!invoiceId.trim().length || !attestationCid.trim().length) {
      enqueueSnackbar('Invoice ID and attestation CID are required.', { variant: 'warning' })
      return
    }

    const parsedAmount = Number.parseFloat(amountAlgos)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      enqueueSnackbar('Enter a positive amount in ALGOs.', { variant: 'warning' })
      return
    }

    setLoading(true)

    const factory = new ClearDealsFactory({
      defaultSender: activeAddress,
      algorand,
    })

    const deployResult = await factory
      .deploy({
        onSchemaBreak: OnSchemaBreak.AppendApp,
        onUpdate: OnUpdate.AppendApp,
      })
      .catch((e: Error) => {
        enqueueSnackbar(`Error deploying the contract: ${e.message}`, { variant: 'error' })
        setLoading(false)
        return undefined
      })

    if (!deployResult) {
      return
    }

    const { appClient } = deployResult
    const appFundingTarget = 500_000
    const rawAppAddress = appClient.appAddress
    const appAddress =
      typeof rawAppAddress === 'string'
        ? rawAppAddress
        : typeof rawAppAddress?.toString === 'function'
          ? rawAppAddress.toString()
          : encodeAddress((rawAppAddress as { publicKey: Uint8Array }).publicKey)

    try {
      await ensureAppFunding(algorand, transactionSigner, activeAddress, appAddress, appFundingTarget)
      await appClient.send.setOperator({ args: { operator: activeAddress } })

      const microAlgos = Math.max(1, Math.round(parsedAmount * 1_000_000))
      const expectedAmount = BigInt(microAlgos)
      const payee = payeeAddress.trim().length ? payeeAddress.trim() : activeAddress

      await appClient.send.demoRecordSettlement({
        args: {
          invoiceId: invoiceId.trim(),
          payee,
          expectedAmount,
          attestationCid: attestationCid.trim(),
        },
      })
      const proof = await appClient.send.getLatestSettlementProof({ args: [] })

      const settlement = proof.return
      const invoice = resolveNative(settlement?.invoiceId) ?? invoiceId
      const amountValue = resolveNative(settlement?.amount)
      const normalizedMicro = (() => {
        if (typeof amountValue === 'bigint') return Number(amountValue)
        if (typeof amountValue === 'number') return amountValue
        if (typeof amountValue === 'string') return Number.parseInt(amountValue, 10)
        return microAlgos
      })()
      const algosLabel = (normalizedMicro / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 6 })
      enqueueSnackbar(`Logged ${invoice} for ${algosLabel} ALGOs → payee ${payee}`, {
        variant: 'success',
      })
      setInvoiceId(makeInvoiceId())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      enqueueSnackbar(`Error calling the contract: ${message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog id="appcalls_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-950/75 backdrop-blur-sm`}>
      <form
        method="dialog"
        className="modal-box max-w-xl rounded-3xl border border-slate-800 bg-slate-950/95 px-8 py-7 text-slate-100 shadow-2xl"
      >
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-rose-300/80">Clear settlements</p>
          <h3 className="text-2xl font-semibold">Log a Clear Settlement Demo</h3>
          <p className="text-sm text-slate-300">
            Deploys the ClearDeals contract, assigns your wallet as operator, and records a demo invoice with an attestation
            hash. Use the fields below to tailor the record that gets stored on-chain.
          </p>
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-xs text-slate-400">
            <p className="font-semibold uppercase tracking-[0.25em] text-rose-200/80">Demo checklist</p>
            <ul className="mt-2 space-y-1 list-disc pl-4">
              <li>Wallet connected (payer defaults to your active address)</li>
              <li>Invoice ID auto-generated per run</li>
              <li>Optional: override payee address or attestation hash</li>
            </ul>
          </div>
        </header>

        <div className="mt-6 space-y-4">
          <label className="block" htmlFor="invoice-id">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">Invoice ID</span>
            <input
              id="invoice-id"
              type="text"
              placeholder="INV-JOLT-2025"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose-400 focus:outline-none"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
            />
          </label>

          <label className="block" htmlFor="payee-address">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">Payee address</span>
            <input
              id="payee-address"
              type="text"
              placeholder="Defaults to your wallet"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose-400 focus:outline-none"
              value={payeeAddress}
              onChange={(e) => setPayeeAddress(e.target.value)}
            />
          </label>

          <label className="block" htmlFor="amount-algos">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">Amount (ALGOs)</span>
            <input
              id="amount-algos"
              type="text"
              placeholder="0.15"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose-400 focus:outline-none"
              value={amountAlgos}
              onChange={(e) => setAmountAlgos(e.target.value)}
            />
          </label>

          <label className="block" htmlFor="attestation-cid">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">Attestation CID</span>
            <input
              id="attestation-cid"
              type="text"
              placeholder="bafy…"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose-400 focus:outline-none"
              value={attestationCid}
              onChange={(e) => setAttestationCid(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-full border border-slate-700 bg-slate-900/60 px-6 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-slate-50"
            onClick={() => setModalState(!openModal)}
          >
            Close
          </button>
          <button
            className="flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-amber-400 px-6 py-2.5 text-sm font-semibold text-slate-50 shadow-[0_0_20px_rgba(244,63,94,0.35)] transition hover:from-rose-500/90 hover:via-red-500/90 hover:to-amber-400/90"
            onClick={sendAppCall}
          >
            {loading ? <span className="loading loading-spinner" /> : 'Record settlement'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default AppCalls

