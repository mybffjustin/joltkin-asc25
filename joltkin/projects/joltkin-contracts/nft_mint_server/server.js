// -----------------------------
// server.js
// -----------------------------
// This backend handles image uploads, pins them (and metadata) to Pinata/IPFS,
// and returns a metadata URL that the frontend can use to mint an NFT on Algorand.
// -----------------------------

const express = require('express')
const cors = require('cors')
const multer = require('multer')
const pinataModule = require('pinata-web3')
const PinataSDK = pinataModule.PinataSDK || pinataModule.default || pinataModule
const dotenv = require('dotenv')
const { Readable } = require('stream')
const path = require('path')

// Ensure we load .env from THIS folder (nft_mint_server/.env)
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
const port = process.env.PORT || 3001

// Allow requests from the frontend (CORS).
// '*' is fine for development; in production, restrict to your app’s URL.
app.use(cors({ origin: '*' }))

// Parse JSON payloads (mainly useful if you add more routes later).
app.use(express.json())

// Log whether environment variables are being read properly.
// Developers will need to set their own API keys in .env (never commit secrets).
console.log('Backend server starting...')
console.log('Pinata API Key:', process.env.PINATA_API_KEY ? 'Loaded' : 'Not Loaded')
console.log('Pinata API Secret:', process.env.PINATA_API_SECRET ? 'Loaded' : 'Not Loaded')
console.log('Pinata JWT:', process.env.PINATA_JWT ? 'Loaded' : 'Not Loaded')

// Multer setup: keep uploaded files in memory (not saved to disk).
// This makes it easier to forward the file directly to Pinata.
const upload = multer({ storage: multer.memoryStorage() })

// Pinata client setup.
// By default this uses API key + secret from your .env, or JWT if provided.
const pinataConfig = {}
if (process.env.PINATA_JWT) {
  pinataConfig.pinataJwt = process.env.PINATA_JWT
}
if (process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET) {
  pinataConfig.pinataApiKey = process.env.PINATA_API_KEY
  pinataConfig.pinataSecretApiKey = process.env.PINATA_API_SECRET
}

if (!pinataConfig.pinataJwt && !(pinataConfig.pinataApiKey && pinataConfig.pinataSecretApiKey)) {
  console.error('Pinata credentials missing. Provide PINATA_JWT or API key + secret in .env.')
  process.exit(1)
}

const pinata = new PinataSDK(pinataConfig)

const hasNewUploadApi = typeof pinata.upload === 'object' && typeof pinata.upload.file === 'function'

function extractCid(result) {
  if (!result) return undefined
  if (typeof result === 'string') return result
  if (result.cid) return result.cid
  if (result.IpfsHash) return result.IpfsHash
  if (Array.isArray(result.files)) {
    const firstFile = result.files.find((item) => item?.cid || item?.hash)
    if (firstFile?.cid) return firstFile.cid
    if (firstFile?.hash) return firstFile.hash
  }
  if (Array.isArray(result.items)) {
    const firstItem = result.items.find((item) => item?.cid || item?.hash)
    if (firstItem?.cid) return firstItem.cid
    if (firstItem?.hash) return firstItem.hash
  }
  return undefined
}

// Test Pinata credentials when the server starts.
// If this fails, check your .env file.
;(async () => {
  try {
    const auth = await pinata.testAuthentication?.()
    console.log('Pinata auth OK:', auth || 'ok')
  } catch (e) {
    console.error('Pinata authentication FAILED. Check env vars.', e)
  }
})()

// Simple health endpoint so the frontend (or you) can check if the server is live.
app.get('/health', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ ok: true, ts: Date.now() })
})

// -----------------------------
// Main endpoint: /api/pin-image
// -----------------------------
// 1. Accepts an image file from the frontend
// 2. Pins the file to Pinata/IPFS
// 3. Creates NFT metadata JSON pointing to that image
// 4. Pins metadata JSON to IPFS
// 5. Returns the metadata URL for use in Algorand NFT minting
app.post('/api/pin-image', upload.single('file'), async (req, res) => {
  console.log('API endpoint /api/pin-image was hit!')
  try {
    const file = req.file
    if (!file) {
      console.log('Error: No file uploaded.')
      return res.status(400).json({ error: 'No file uploaded' })
    }
    console.log('File received:', {
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    })

    const imageName = file.originalname || 'MasterPass Ticket Image'
    const imageOptions = { metadata: { name: imageName } }
    let imageCid
    let imageUploadResult

    if (hasNewUploadApi) {
      const fileBlob = new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' })
      imageUploadResult = await pinata.upload.file(fileBlob, imageOptions)
      imageCid = extractCid(imageUploadResult)
    } else {
      // Convert the uploaded buffer into a Readable stream for the legacy SDK
      const stream = Readable.from(file.buffer)
      // @ts-ignore (JS file): attach path so sdk has a name
      stream.path = imageName
      const legacyOptions = { pinataMetadata: { name: imageName } }
      imageUploadResult = await pinata.pinFileToIPFS(stream, legacyOptions)
      imageCid = extractCid(imageUploadResult)
    }
    if (!imageCid) {
      console.error('Debug Pinata file upload response:', imageUploadResult)
      throw new Error('Pinata file upload succeeded but no CID returned')
    }
    const imageUrl = `ipfs://${imageCid}`
    console.log('Image pinned to IPFS:', imageUrl)

    // Build NFT metadata JSON (customize name/description/properties here).
    const metadata = {
      name: 'NFT Example',
      description: 'This is an unchangeable NFT',
      image: imageUrl,
      properties: {},
    }

    // Pin the metadata JSON to IPFS
    const jsonName = 'MasterPass Ticket Metadata'
    const jsonOptions = { metadata: { name: jsonName } }
    const metadataUploadResult = hasNewUploadApi
      ? await pinata.upload.json(metadata, jsonOptions)
      : await pinata.pinJSONToIPFS(metadata, { pinataMetadata: { name: jsonName } })
    const metadataCid = extractCid(metadataUploadResult)
    if (!metadataCid) {
      console.error('Debug Pinata metadata response:', metadataUploadResult)
      throw new Error('Pinata metadata upload succeeded but no CID returned')
    }
    const metadataUrl = `ipfs://${metadataCid}`
    console.log('Successfully pinned metadata. URL:', metadataUrl)

    // Respond back to the frontend with the metadata URL
    res.status(200).json({ metadataUrl })
    console.log('Response sent to frontend.')
  } catch (error) {
    // Log detailed error info for debugging.
    const details = {
      message: error?.message,
      status: error?.status || error?.response?.status,
      data: error?.response?.data,
      stack: error?.stack,
    }
    console.error('Error in /api/pin-image:', details)

    // Send a simplified error message to the frontend.
    const msg =
      (typeof details.data === 'string' && details.data) ||
      details.data?.error ||
      details.message ||
      'Failed to pin to IPFS.'
    res.status(500).json({ error: msg })
  }
})

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening at http://localhost:${port}`)
})
