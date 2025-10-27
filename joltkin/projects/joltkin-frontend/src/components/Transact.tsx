// Transact.tsx
// Simple payment component: send 1 ALGO or 1 USDC from connected wallet → receiver address.
// Uses Algokit + wallet connector. Designed for TestNet demos.

import { algo, AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState, useEffect } from 'react'
import { AiOutlineLoading3Quarters, AiOutlineSend } from 'react-icons/ai'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

type ParsedAlgorandErrorCode = 'already-opted-in' | 'user-declined' | 'insufficient-balance' | 'generic'

interface ParsedAlgorandError {
  code: ParsedAlgorandErrorCode
  userMessage: string
}

const safeBigInt = (value: unknown): bigint | null => {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.trunc(value))
  if (typeof value === 'string' && value.trim() !== '') {
    try {
      return BigInt(value.trim())
    } catch {
      return null
    }
  }
  return null
}

const findAssetHolding = (accountInformation: unknown, assetId: bigint): { amount: bigint | null } | null => {
  if (!accountInformation || typeof accountInformation !== 'object') {
    return null
  }

  const possibleAssets = (accountInformation as { assets?: unknown }).assets
  if (!Array.isArray(possibleAssets)) {
    return null
  }

  for (const entry of possibleAssets) {
    if (!entry || typeof entry !== 'object') {
      continue
    }
    const assetRecord = entry as Record<string, unknown>
    const nestedAsset = assetRecord.asset
    const rawId =
      assetRecord['asset-id'] ??
      assetRecord.assetId ??
      (nestedAsset && typeof nestedAsset === 'object' ? (nestedAsset as Record<string, unknown>).id : undefined)

    const parsedId = safeBigInt(rawId)
    if (parsedId === null || parsedId !== assetId) {
      continue
    }

    const rawAmount = assetRecord.amount ?? assetRecord.balance
    return { amount: safeBigInt(rawAmount) }
  }

  return null
}

const parseAlgorandError = (error: unknown): ParsedAlgorandError => {
  const collected: string[] = []

  if (typeof error === 'string') {
    collected.push(error)
  }

  if (error instanceof Error) {
    if (error.message) {
      collected.push(error.message)
    }
    const errorWithData = error as Error & { data?: unknown }
    if (errorWithData.data) {
      collected.push(String(errorWithData.data))
    }
  }

  const errorWithResponse = error as { response?: { body?: { message?: unknown } } }
  const responseMessage = errorWithResponse?.response?.body?.message
  if (typeof responseMessage === 'string') {
    collected.push(responseMessage)
  }

  const combined = collected.join(' ').trim() || 'Unknown error'
  const normalized = combined.toLowerCase()

  if (normalized.includes('already') && normalized.includes('opt') && (normalized.includes('have') || normalized.includes('own'))) {
    return { code: 'already-opted-in', userMessage: 'Wallet already opted in to this asset' }
  }

  if (
    normalized.includes('overspend') ||
    normalized.includes('underflow') ||
    normalized.includes('underfunded') ||
    normalized.includes('insufficient')
  ) {
    return { code: 'insufficient-balance', userMessage: 'Insufficient balance to complete the transaction' }
  }

  if (normalized.includes('reject') || normalized.includes('decline') || normalized.includes('cancel')) {
    return { code: 'user-declined', userMessage: 'Transaction was rejected in the wallet' }
  }

  return { code: 'generic', userMessage: combined }
}

interface TransactInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Transact = ({ openModal, setModalState }: TransactInterface) => {
  const LORA = 'https://lora.algokit.io/testnet'

  // UI state
  const [loading, setLoading] = useState<boolean>(false)
  const [receiverAddress, setReceiverAddress] = useState<string>('')
  const [assetType, setAssetType] = useState<'ALGO' | 'USDC'>('ALGO') // toggle between ALGO and USDC

  // Atomic transfer UI state
  const [groupLoading, setGroupLoading] = useState<boolean>(false)
  const [groupReceiverAddress, setGroupReceiverAddress] = useState<string>('')

  // Opt-in UI state
  const [optInLoading, setOptInLoading] = useState<boolean>(false)
  const [alreadyOpted, setAlreadyOpted] = useState<boolean>(false)
  const [usdcBalance, setUsdcBalance] = useState<bigint | null>(null)

  // Algorand client setup (TestNet by default from env)
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })

  // Wallet + notifications
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  // USDC constants (TestNet ASA)
  const usdcAssetId = 10458941n
  const usdcDecimals = 6

  // --- Pre-check: is wallet already opted in to USDC? (runs when modal opens or wallet changes)
  useEffect(() => {
    const checkOptIn = async () => {
      try {
        if (!openModal || !activeAddress) {
          setAlreadyOpted(false)
          setUsdcBalance(null)
          return
        }
        const accountInformation = await algorand.client.algod.accountInformation(activeAddress).do()
        const holding = findAssetHolding(accountInformation, usdcAssetId)
        setAlreadyOpted(Boolean(holding))
        setUsdcBalance(holding?.amount ?? null)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Opt-in precheck failed:', e)
      }
    }
    checkOptIn()
  }, [openModal, activeAddress])

  // ------------------------------
  // Handle sending single payment
  // ------------------------------
  const handleSubmit = async () => {
    setLoading(true)

    // Guard: wallet must be connected
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setLoading(false)
      return
    }

    try {
      enqueueSnackbar(`Sending ${assetType} transaction...`, { variant: 'info' })

      let txResult
      let msg

      if (assetType === 'ALGO') {
        txResult = await algorand.send.payment({
          signer: transactionSigner,
          sender: activeAddress,
          receiver: receiverAddress,
          amount: algo(1),
        })
        msg = '✅ 1 ALGO sent!'
      } else {
        const oneUSDC = 1n * 10n ** BigInt(usdcDecimals)
        if (!alreadyOpted) {
          enqueueSnackbar('Please opt in to USDC before sending it.', { variant: 'warning' })
          setLoading(false)
          return
        }
        if (usdcBalance === null || usdcBalance < oneUSDC) {
          enqueueSnackbar('Not enough USDC in your wallet to send 1 USDC.', { variant: 'warning' })
          setLoading(false)
          return
        }
        const usdcAmount = 1n * 10n ** BigInt(usdcDecimals)
        txResult = await algorand.send.assetTransfer({
          signer: transactionSigner,
          sender: activeAddress,
          receiver: receiverAddress,
          assetId: usdcAssetId,
          amount: usdcAmount,
        })
        msg = '✅ 1 USDC sent!'
      }

      const txId = txResult?.txIds?.[0]

      enqueueSnackbar(`${msg} TxID: ${txId}`, {
        variant: 'success',
        action: () =>
          txId ? (
            <a
              href={`${LORA}/transaction/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', marginLeft: 8 }}
            >
              View on Lora ↗
            </a>
          ) : null,
      })

      // Reset form
      setReceiverAddress('')
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      const parsed = parseAlgorandError(e)
      enqueueSnackbar(`Failed to send ${assetType}${parsed.userMessage ? `: ${parsed.userMessage}` : ''}`, {
        variant: 'error',
      })
    }

    setLoading(false)
  }

  // ------------------------------
  // USDC Opt-in for CONNECTED wallet (fixed: safe BigInt handling)
  // ------------------------------
  const handleOptInUSDC = async () => {
    setOptInLoading(true)

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setOptInLoading(false)
      return
    }

    try {
      // Check if already opted in (defensive against missing/varied shapes)
      const accountInformation = await algorand.client.algod.accountInformation(activeAddress).do()
      const holding = findAssetHolding(accountInformation, usdcAssetId)
      const alreadyOptedNow = Boolean(holding)

      setAlreadyOpted(alreadyOptedNow)
      setUsdcBalance(holding?.amount ?? null)

      if (alreadyOptedNow) {
        enqueueSnackbar('Your wallet is already opted in to USDC.', { variant: 'info' })
        setOptInLoading(false)
        return
      }

      // Opt in to USDC ASA
      const res = await algorand.send.assetOptIn({
        signer: transactionSigner,
        sender: activeAddress,
        assetId: usdcAssetId,
      })

      const txId = res?.txIds?.[0]
      enqueueSnackbar(`✅ Opt-in complete for USDC. TxID: ${txId}`, {
        variant: 'success',
        action: () =>
          txId ? (
            <a
              href={`${LORA}/transaction/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', marginLeft: 8 }}
            >
              View on Lora ↗
            </a>
          ) : null,
      })

      // reflect that we're now opted in
      setAlreadyOpted(true)
      setUsdcBalance(0n)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      const parsed = parseAlgorandError(e)

      if (parsed.code === 'already-opted-in') {
        setAlreadyOpted(true)
        enqueueSnackbar('Your wallet is already opted in to USDC.', { variant: 'info' })
      } else if (parsed.code === 'user-declined') {
        enqueueSnackbar('USDC opt-in was canceled in the wallet.', { variant: 'warning' })
      } else if (parsed.code === 'insufficient-balance') {
        enqueueSnackbar('Need a bit more ALGO to opt in (min balance + fees).', { variant: 'warning' })
      } else {
        enqueueSnackbar(`USDC opt-in failed${parsed.userMessage ? `: ${parsed.userMessage}` : ''}.`, {
          variant: 'error',
        })
      }
    }

    setOptInLoading(false)
  }

  // ------------------------------
  // Handle Atomic Group (2-in-1)
  // Sends: 1 ALGO + 1 USDC to the same receiver in one atomic group.
  // Note: Receiver must be opted-in to USDC (10458941).
  // ------------------------------
  const handleAtomicGroup = async () => {
    setGroupLoading(true)

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setGroupLoading(false)
      return
    }
    if (groupReceiverAddress.length !== 58) {
      enqueueSnackbar('Enter a valid Algorand address (58 chars).', { variant: 'warning' })
      setGroupLoading(false)
      return
    }

    try {
      enqueueSnackbar('Sending atomic transfer: 1 ALGO + 1 USDC...', { variant: 'info' })

      const group = algorand.newGroup()

      // Tx 1: 1 ALGO payment
      group.addPayment({
        signer: transactionSigner,
        sender: activeAddress,
        receiver: groupReceiverAddress,
        amount: algo(1),
      })

      // Tx 2: 1 USDC ASA transfer (receiver must be opted-in)
      const oneUSDC = 1n * 10n ** BigInt(usdcDecimals)
      group.addAssetTransfer({
        signer: transactionSigner,
        sender: activeAddress,
        receiver: groupReceiverAddress,
        assetId: usdcAssetId,
        amount: oneUSDC,
      })

      const result = await group.send()
      const firstTx = result?.txIds?.[0]

      enqueueSnackbar(`✅ Atomic transfer complete! (1 ALGO + 1 USDC)`, {
        variant: 'success',
        action: () =>
          firstTx ? (
            <a
              href={`${LORA}/transaction/${firstTx}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', marginLeft: 8 }}
            >
              View one tx on Lora ↗
            </a>
          ) : null,
      })

      setGroupReceiverAddress('')
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      enqueueSnackbar('Atomic transfer failed. Make sure the receiver is opted into USDC (10458941).', {
        variant: 'error',
      })
    }

    setGroupLoading(false)
  }

  // ------------------------------
  // Modal UI
  // ------------------------------
  return (
    <dialog id="transact_modal" className={`modal modal-bottom sm:modal-middle backdrop-blur-sm ${openModal ? 'modal-open' : ''}`}>
      <div className="modal-box bg-neutral-800 text-gray-100 rounded-2xl shadow-xl border border-neutral-700 p-6">
        <h3 className="flex items-center gap-3 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500 mb-6">
          <AiOutlineSend className="text-3xl" />
          Send a Payment
        </h3>

        {/* Receiver Address input (single send) */}
        <div className="form-control">
          <label className="label">
            <span className="label-text text-gray-400">Receiver's Address</span>
          </label>
          <input
            type="text"
            data-test-id="receiver-address"
            className="input input-bordered w-full bg-neutral-700 text-gray-100 border-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            placeholder="e.g., KPLX..."
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
          />
          {/* Address length check for Algorand (58 chars) */}
          <div className="flex justify-between items-center text-xs mt-2">
            <span className="text-gray-500">Amount: 1 {assetType}</span>
            <span className={`font-mono ${receiverAddress.length === 58 ? 'text-green-400' : 'text-red-400'}`}>
              {receiverAddress.length}/58
            </span>
          </div>
        </div>

        {/* Toggle ALGO ↔ USDC */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            type="button"
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              assetType === 'ALGO' ? 'bg-cyan-600 text-white' : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
            }`}
            onClick={() => setAssetType('ALGO')}
          >
            ALGO
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              assetType === 'USDC' ? 'bg-cyan-600 text-white' : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
            }`}
            onClick={() => setAssetType('USDC')}
          >
            USDC
          </button>
        </div>

        {/* Action buttons (single send) */}
        <div className="modal-action mt-6 flex flex-col-reverse sm:flex-row-reverse gap-3">
          <button
            data-test-id="send"
            type="button"
            className={`
              btn w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white rounded-xl border-none font-semibold transition-all duration-300 transform active:scale-95
              ${receiverAddress.length === 58 ? '' : 'btn-disabled bg-neutral-500 text-gray-200 cursor-not-allowed'}
            `}
            onClick={handleSubmit}
            disabled={loading || receiverAddress.length !== 58}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                Sending...
              </span>
            ) : (
              `Send 1 ${assetType}`
            )}
          </button>
          <button
            type="button"
            className="btn w-full sm:w-auto bg-neutral-700 hover:bg-neutral-600 border-none text-gray-300 rounded-xl"
            onClick={() => setModalState(false)}
          >
            Close
          </button>
        </div>

        {/* -------------------------------------------------
            Atomic Transfer (Separate Demo Section)
            ------------------------------------------------- */}
        <div className="mt-8 p-4 rounded-xl border border-neutral-700 bg-neutral-900">
          <h4 className="text-lg font-semibold mb-2">Atomic Transfer (2-in-1)</h4>
          <p className="text-sm text-gray-400 mb-3">
            Send <span className="font-semibold text-gray-200">1 ALGO</span> + <span className="font-semibold text-gray-200">1 USDC</span>{' '}
            together in one atomic group.
            <br />
            <span className="text-gray-500">Note: Receiver must be opted-in to USDC (ID: 10458941).</span>
          </p>

          {/* Opt-in button for connected wallet */}
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <button
              type="button"
              className={`btn border-none rounded-xl w-full sm:w-auto ${alreadyOpted ? 'bg-neutral-500 text-gray-200 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
              onClick={handleOptInUSDC}
              disabled={optInLoading || !activeAddress || alreadyOpted}
            >
              {optInLoading ? (
                <span className="flex items-center gap-2">
                  <AiOutlineLoading3Quarters className="animate-spin" />
                  Opting in...
                </span>
              ) : alreadyOpted ? (
                'Already Opted In'
              ) : (
                'Opt in USDC (my wallet)'
              )}
            </button>
          </div>

          {/* Receiver input (for atomic group) */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-400">Receiver's Address</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full bg-neutral-700 text-gray-100 border-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="e.g., KPLX..."
              value={groupReceiverAddress}
              onChange={(e) => setGroupReceiverAddress(e.target.value)}
            />
            <div className="flex justify-between items-center text-xs mt-2">
              <span className="text-gray-500">Bundle: 1 ALGO + 1 USDC</span>
              <span className={`font-mono ${groupReceiverAddress.length === 58 ? 'text-green-400' : 'text-red-400'}`}>
                {groupReceiverAddress.length}/58
              </span>
            </div>
          </div>

          {/* Atomic send button */}
          <button
            type="button"
            className={`
              mt-4 btn w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl border-none font-semibold transition-all duration-300 transform active:scale-95
              ${groupReceiverAddress.length === 58 ? '' : 'btn-disabled bg-neutral-500 text-gray-200 cursor-not-allowed'}
            `}
            onClick={handleAtomicGroup}
            disabled={groupLoading || groupReceiverAddress.length !== 58}
          >
            {groupLoading ? (
              <span className="flex items-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                Sending Atomic...
              </span>
            ) : (
              'Send Atomic: 1 ALGO + 1 USDC'
            )}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default Transact
