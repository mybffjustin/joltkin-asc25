// src/components/Home.tsx
// Main landing UI: shows navbar, hero text, and feature cards.
// This file only handles layout and modals — safe place to customize design.

import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AiOutlineWallet, AiOutlineSend, AiOutlineStar, AiOutlineDeploymentUnit } from 'react-icons/ai'
import { BsArrowUpRightCircle, BsWallet2 } from 'react-icons/bs'

// Frontend modals
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import NFTmint from './components/NFTmint'
import Tokenmint from './components/Tokenmint'

// Smart contract demo modal (backend app calls)
import AppCalls from './components/AppCalls'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false)
  const [openMintModal, setOpenMintModal] = useState<boolean>(false)
  const [openTokenModal, setOpenTokenModal] = useState<boolean>(false)
  const [openAppCallsModal, setOpenAppCallsModal] = useState<boolean>(false)

  const { activeAddress } = useWallet()

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-rose-950 to-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-rose-600/25 blur-3xl" />
        <div className="absolute bottom-0 right-[-10rem] h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* ---------------- Navbar ---------------- */}
        <nav className="border-b border-slate-800/60 bg-slate-950/70 px-6 py-5 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/30 via-slate-900 to-amber-400/20 shadow-[0_0_35px_rgba(244,63,94,0.35)]">
                <AiOutlineWallet className="text-2xl text-rose-200" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-rose-300/70">Joltkin</p>
                <h1 className="text-lg font-semibold text-slate-50">Algorand Pilot Control Center</h1>
              </div>
            </div>
            <button
              className="flex items-center gap-2 rounded-full border border-rose-500/40 bg-slate-900/80 px-5 py-2 text-sm font-semibold text-slate-100 shadow-lg shadow-rose-500/10 transition hover:border-rose-400/70 hover:bg-slate-900"
              onClick={() => setOpenWalletModal(true)}
            >
              <BsWallet2 className="text-base text-rose-200" />
              <span>{activeAddress ? 'Wallet Connected' : 'Connect Wallet'}</span>
            </button>
            <a
              href="/pilot-control-center"
              className="hidden items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/80 px-5 py-2 text-sm font-semibold text-slate-200 shadow-lg shadow-slate-900/20 transition hover:border-rose-400/60 hover:text-rose-100 sm:flex"
            >
              <BsArrowUpRightCircle className="text-base text-rose-200" />
              Pilot Control Center
            </a>
          </div>
        </nav>

        <main className="flex-1">
          {/* ---------------- Hero Section ---------------- */}
          <header className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:py-20">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/20 to-clear p-8 shadow-xl shadow-rose-500/15 backdrop-blur-lg">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-slate-900/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-rose-200/90">
                  <span>Validated on Algorand TestNet</span>
                </div>
                <h2 className="text-4xl font-bold leading-tight text-slate-50 sm:text-5xl">
                  Sell • Scan • Settle without door chaos or spreadsheet debt
                </h2>
                <p className="mt-5 max-w-xl text-base text-slate-300">
                  <span>Joltkin unifies ticketing, door operations, and clear settlements for Harvard student productions—</span>{' '}
                  <span>blending wallet-native proof with Web2 ease so Algorand pilots stand up fast.</span>
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="mailto:justinh@alumni.harvard.edu?subject=Joltkin%20Algorand%20Pilot%20Inquiry&body=Hi%20Justin%2C%0A%0AI%27d%20like%20to%20learn%20more%20about%20the%20Joltkin%20Algorand%20Pilot.%0A%0ABest%2C%0A[Your%20Name]"
                    className="flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-amber-400 px-7 py-3 text-sm font-semibold text-rose-50 transition hover:shadow-[0_0_25px_rgba(244,63,94,0.4)]"
                  >
                    Join the Pilot Waitlist
                  </a>
                  <a
                    href="#proof"
                    className="flex items-center justify-center rounded-full border border-rose-400/60 bg-slate-900/70 px-7 py-3 text-sm font-semibold text-rose-200 transition hover:border-rose-300/80"
                  >
                    Review Proof Artifacts
                  </a>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-inner shadow-slate-900/60 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.35em] text-rose-300/80">Pilot Snapshot</p>
                  <p className="mt-4 text-lg font-semibold text-slate-100">Q4 2025 Harvard & Algorand Startup Challenges</p>
                  <ul className="mt-5 space-y-3 text-sm text-slate-300">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-400" />
                      <span>
                        Discovery: 14 Harvard org interviews logged—DAO intake, Student Engagement loop, and SOCH&apos;s 50k sq ft hub
                        mapped for event logistics.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span>Pilot readiness: checkout → door scan → settlement loop verified on Algorand TestNet.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
                      <span>Traction assets packaged for judges: explorer receipts, Pinata metadata, and pilot timeline.</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-3xl border border-rose-500/40 bg-gradient-to-br from-rose-500/15 via-slate-900/60 to-clear p-6 shadow-lg shadow-rose-500/20">
                  <p className="text-xs uppercase tracking-[0.35em] text-rose-200/80">Next Milestones</p>
                  <ol className="mt-4 space-y-2 text-sm text-slate-200">
                    <li className="flex gap-3">
                      <span className="font-semibold text-rose-300">01</span>
                      <span>Nov 1: Drop discovery recap + explorer Loom in Algorand Startup + Harvard i-lab Slack channels.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-rose-300">02</span>
                      <span>Nov 8: Lock DAO accessibility consultant + SOCH StudentOrg ops letters of intent.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-rose-300">03</span>
                      <span>Nov 15: Submit $125K Algorand Startup Challenge packet with Harvard pilot endorsements.</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </header>

          {/* ---------------- Proof & Traction ---------------- */}
          <section id="proof" className="mx-auto w-full max-w-6xl px-6 pb-16">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-slate-100">Proof &amp; traction artifacts</h3>
              <p className="text-xs uppercase tracking-[0.4em] text-rose-200/80">Clear since day one</p>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <article className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Wallet instrumentation</p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-300">
                      Connect telemetry is being wired into the next pilot run; we will publish verified counts once logs are live.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    <li>Finalize logging with SOCH StudentOrg ops review</li>
                    <li>Re-test door flow with DAO accessibility guidance</li>
                    <li>Publish anonymized metrics in November update</li>
                  </ul>
                </div>
              </article>

              <article className="rounded-3xl border border-rose-500/40 bg-slate-900/70 p-6 shadow-lg shadow-rose-500/20">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Explorer receipts</p>
                <div className="mt-5 space-y-6 text-sm text-slate-200">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-rose-200/80">Clear Deals • Verified Oct 27 2025</p>
                    <p className="mt-2 text-slate-300">
                      Captures the ClearDeals demo run—auto-funding the app account, assigning the operator, and logging a settlement
                      invoice so judges can replay the modal flow end-to-end.
                    </p>
                    <div className="mt-3 space-y-2">
                      <a
                        href="https://lora.algokit.io/testnet/transaction/SLY7CW3PK65PAJRMHVLYP4CIKAM5HPDRI6IL23ZCQULFL6CYAD7A"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 transition hover:border-rose-400/70 hover:text-rose-200"
                        aria-label="View transaction SLY7CW3PK65PAJRMHVLYP4CIKAM5HPDRI6IL23ZCQULFL6CYAD7A on Lora explorer"
                      >
                        <span>Txn SLY7C…AD7A</span>
                        <BsArrowUpRightCircle className="text-lg text-rose-300" />
                      </a>
                      <a
                        href="https://lora.algokit.io/testnet/transaction/XXKJ2XMHEH2CCD5ZNWGUSVKOGOWUOKRXZ3USVKBZMWPTOZDZP5VA"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 transition hover:border-rose-400/70 hover:text-rose-200"
                        aria-label="View transaction XXKJ2XMHEH2CCD5ZNWGUSVKOGOWUOKRXZ3USVKBZMWPTOZDZP5VA on Lora explorer"
                      >
                        <span>Txn XXKJ2…P5VA</span>
                        <BsArrowUpRightCircle className="text-lg text-rose-300" />
                      </a>
                      <a
                        href="https://lora.algokit.io/testnet/transaction/RPOCSORCATDKY4F4ISFY3JELMHJBJQQCHFUT3HQGWHGQOM6EORJQ"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 transition hover:border-rose-400/70 hover:text-rose-200"
                        aria-label="View transaction RPOCSORCATDKY4F4ISFY3JELMHJBJQQCHFUT3HQGWHGQOM6EORJQ on Lora explorer"
                      >
                        <span>Txn RPOCS…ORJQ</span>
                        <BsArrowUpRightCircle className="text-lg text-rose-300" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-rose-200/80">Mint NFT • Verified Oct 26 2025</p>
                    <p className="mt-2 text-slate-300">
                      Proves the image to Pinata to Algorand pipeline so ticket receipts or collectible passes ship with ready-made IPFS
                      metadata.
                    </p>
                    <a
                      href="https://lora.algokit.io/testnet/asset/748593302"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 transition hover:border-rose-400/70 hover:text-rose-200"
                      aria-label="View asset 748593302 on Lora explorer"
                    >
                      <span>ASA 748593302</span>
                      <BsArrowUpRightCircle className="text-lg text-rose-300" />
                    </a>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-rose-200/80">Create Token • Verified Oct 26 2025</p>
                    <p className="mt-2 text-slate-300">
                      Demonstrates issuer-side ASA creation for MasterPass-style perks—loyalty credits, comp balances, or sponsor tokens.
                    </p>
                    <a
                      href="https://lora.algokit.io/testnet/asset/748594201"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 transition hover:border-rose-400/70 hover:text-rose-200"
                      aria-label="View asset 748594201 on Lora explorer"
                    >
                      <span>ASA 748594201</span>
                      <BsArrowUpRightCircle className="text-lg text-rose-300" />
                    </a>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-rose-200/80">Clear Deals • Updated Oct 27 2025</p>
                    <p className="mt-2 text-slate-300">
                      ARC-4 contract now stores invoice IDs, payer/payee addresses, attestation CIDs, and settlement rounds. Deploy script
                      emits a demo settlement and prints the proof bundle for judges.
                    </p>
                    <div className="mt-3 space-y-2">
                      <a
                        href="https://github.com/mybffjustin/joltkin-asc25/blob/main/joltkin/projects/joltkin-contracts/smart_contracts/clear_deals/contract.algo.ts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 transition hover:border-rose-400/70 hover:text-rose-200"
                        aria-label="View ClearDeals contract source"
                      >
                        <span>ClearDeals contract source</span>
                        <BsArrowUpRightCircle className="text-lg text-rose-300" />
                      </a>
                      <a
                        href="https://github.com/mybffjustin/joltkin-asc25/blob/main/joltkin/projects/joltkin-contracts/smart_contracts/clear_deals/contract.algo.spec.ts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 transition hover:border-rose-400/70 hover:text-rose-200"
                        aria-label="View settlement contract unit tests"
                      >
                        <span>Settlement unit tests (Vitest)</span>
                        <BsArrowUpRightCircle className="text-lg text-rose-300" />
                      </a>
                      <a
                        href="https://lora.algokit.io/testnet/transaction/ICVYOXBHQNESFSMIHY2IQNQG4GS2GZ7N2Q3YLHST5OKPQJ3GOCBA"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 transition hover:border-rose-400/70 hover:text-rose-200"
                        aria-label="View prior settlement proof on Lora explorer"
                      >
                        <span>Prior settlement receipt (Txn ICVYO…OCBA)</span>
                        <BsArrowUpRightCircle className="text-lg text-rose-300" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Discovery discipline</p>
                <div className="mt-5 space-y-6 text-sm text-slate-300">
                  <div>
                    <p className="text-base font-semibold text-slate-100">Silver insights (80% discovery wins)</p>
                    <ul className="mt-4 space-y-3">
                      <li className="space-y-1">
                        <span className="font-semibold text-rose-200">No more P2P ticketing.</span>
                        <p>Student-center policies ban Venmo-style sales; treasurers want compliant exports.</p>
                        <p className="text-slate-400">So what? Lead with audit-ready checkout + exports.</p>
                      </li>
                      <li className="space-y-1">
                        <span className="font-semibold text-rose-200">Fee fatigue is real.</span>
                        <p>Reviews slam Eventbrite payouts & fees when money is delayed or withheld.</p>
                        <p className="text-slate-400">So what? Keep per-show pricing transparent and predictable.</p>
                      </li>
                      <li className="space-y-1">
                        <span className="font-semibold text-rose-200">Duplicate screenshots plague doors.</span>
                        <p>Industry guidance calls for single-use scans that invalidate immediately.</p>
                        <p className="text-slate-400">So what? Feature duplicate rate &lt;2% in demos.</p>
                      </li>
                      <li className="space-y-1">
                        <span className="font-semibold text-rose-200">Capacity risk stresses ops.</span>
                        <p>Fire-code orgs insist on live capacity bars with 80% / 90% threshold alerts.</p>
                        <p className="text-slate-400">So what? Deliver alerts tied to documented responses.</p>
                      </li>
                      <li className="space-y-1">
                        <span className="font-semibold text-rose-200">Clean exports win finance.</span>
                        <p>Treasurers crave one CSV + PDF with comp reasons that advisors approve on first pass.</p>
                        <p className="text-slate-400">So what? Doors-close → export ≤10 min becomes a core KPI.</p>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-rose-200/80">Segment snapshots</p>
                    <div className="mt-4 space-y-4 text-sm">
                      <div className="space-y-2">
                        <p className="font-semibold text-slate-100">Sophia — Student producer</p>
                        <p>Every show hits 8–12 mismatches, delays the curtain ~10 minutes, and costs $40 extra staff.</p>
                        <p className="text-slate-400">Budget holder with $100–$250 per show ready to spend if chaos drops.</p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-slate-100">Emma — Venue ops</p>
                        <p>Needs capacity compliance, duplicate prevention, and comp reason trails to stay within fire-code limits.</p>
                        <p className="text-slate-400">Goal: shrink 30–45 minute reconciliation sprints to minutes.</p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-slate-100">Ava — Student finance</p>
                        <p>Spends 4–6 hours every weekend cleaning CSVs, chasing producers, and packaging PDFs.</p>
                        <p className="text-slate-400">Ideal export: buyer_email, ticket_id, scan audit, fees, net, comp reason.</p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-slate-100">Evelyn — Superfan attendee</p>
                        <p>Delayed one in four shows today and once turned away for the wrong night.</p>
                        <p className="text-slate-400">Wants a ticket that just scans and an easy transfer option if plans change.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-rose-200/80">Quant anchors & experiments</p>
                    <ul className="mt-3 space-y-2 text-sm">
                      <li>• Track median scan time &lt; 10s; duplicate rate &lt; 2%; ≥80% comps have a reason code.</li>
                      <li>• Doors-close → finance export in ≤10 minutes; advisor acceptance &gt; 95%.</li>
                      <li>• Experiments: split scan vs. screenshot lines, finance export dry-run, capacity alert rehearsal.</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-rose-200/80">Interview cadence</p>
                    <ul className="mt-3 space-y-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                      <li>5-in-5 interview rotation</li>
                      <li>Problem reframed after each synthesis</li>
                      <li>Follow-up confirm sessions locked for Nov 3</li>
                    </ul>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-rose-500/40 bg-slate-900/70 p-6 shadow-lg shadow-rose-500/20">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Discovery signals</p>
                <div className="mt-5 space-y-4 text-sm text-slate-200">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">Administrative replies logged</p>
                      <p className="text-xs uppercase tracking-[0.25em] text-rose-200/80">
                        DAO • DSO • Student Engagement • StudentOrgs • UDR • Admissions
                      </p>
                    </div>
                    <span className="rounded-full bg-rose-500/20 px-3 py-1 text-sm font-semibold text-rose-200">6</span>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-rose-400" />
                      <span>
                        DAO ticket INC06074498 confirmed scope; consultant follow-up queued for Tue/Thu 10-12 ET virtual office hours.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-rose-400" />
                      <span>
                        DSO + Student Engagement steered us to SOCH StudentOrg ops—Harvard&apos;s 50k sq ft event hub—for detailed workflow
                        mapping.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-rose-400" />
                      <span>
                        StudentOrgs guidance highlighted SOCO/CampusGroups dependencies and guarded contact directories—evidence of latent
                        tooling gaps.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                      <span>
                        UDR response from Smith Campus Center signaled high demand; backlog flagged as timing risk for accommodation pilots.
                      </span>
                    </li>
                  </ul>
                </div>
              </article>
            </div>
          </section>

          {/* ---------------- Problem to Solution ---------------- */}
          <section className="border-y border-slate-800/60 bg-slate-950/60">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-8 shadow-lg shadow-slate-950/30">
                <p className="text-xs uppercase tracking-[0.35em] text-rose-200/80">Today&apos;s pain</p>
                <blockquote className="mt-5 space-y-5 text-slate-200">
                  <p className="text-lg font-semibold">“Door chaos, spreadsheet drift, and angry texts while comps walk in.”</p>
                  <p className="text-sm text-slate-300">
                    Student organizers juggle Venmo, Google Forms, and manual headcounts—making SOCH settlement a late-night chore and
                    letting resale leakage melt margins.
                  </p>
                </blockquote>
              </div>
              <div className="rounded-3xl border border-rose-500/40 bg-slate-900/70 p-8 shadow-lg shadow-rose-500/20">
                <p className="text-xs uppercase tracking-[0.35em] text-rose-200/80">Joltkin flow</p>
                <ol className="mt-6 space-y-6 text-sm text-slate-200">
                  <li className="flex items-start gap-4">
                    <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-sm font-semibold text-rose-300">
                      1
                    </span>
                    <span>Checkout: Stripe test checkout issues dynamic QR tickets, prepped for optional Algorand receipts.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-sm font-semibold text-rose-300">
                      2
                    </span>
                    <span>Scan: Door staff validate once, log “comp with reason,” and flag dupes instantly—even offline.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-sm font-semibold text-rose-300">
                      3
                    </span>
                    <span>Settle: Auto-split SOCH-ready CSV/PDF exports with explorer links so treasurers trust every payout.</span>
                  </li>
                </ol>
              </div>
            </div>
          </section>

          {/* ---------------- Feature Spotlight ---------------- */}
          <section className="mx-auto w-full max-w-6xl px-6 py-16">
            <h3 className="text-2xl font-semibold text-slate-100">Feature spotlight</h3>
            <p className="mt-3 text-sm text-slate-300">
              Connect to unlock the live flows below. View proof any time via the explorer dossier.
            </p>
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <article className="group rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40 transition hover:border-rose-400/60">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
                  <AiOutlineSend className="text-xl" />
                </div>
                <h4 className="text-lg font-semibold text-slate-100">Ticketing + payments</h4>
                <p className="mt-3 text-sm text-slate-300">
                  Issue dynamic QR tickets with atomic USDC settlements so split payouts are verifiable.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeAddress ? 'bg-rose-500 text-slate-950 hover:bg-rose-400' : 'bg-slate-800 text-slate-500'
                    }`}
                    onClick={() => setOpenPaymentModal(true)}
                    disabled={!activeAddress}
                  >
                    Launch Flow
                  </button>
                  <a href="#proof" className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-200/80">
                    View Proof
                  </a>
                </div>
              </article>

              <article className="group rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40 transition hover:border-rose-400/60">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-600/15 text-rose-300">
                  <AiOutlineStar className="text-xl" />
                </div>
                <h4 className="text-lg font-semibold text-slate-100">Door operations</h4>
                <p className="mt-3 text-sm text-slate-300">
                  Mint NFTs with Pinata-backed metadata for VIP tiers and tamper-proof access badges.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeAddress ? 'bg-rose-600 text-slate-950 hover:bg-rose-500' : 'bg-slate-800 text-slate-500'
                    }`}
                    onClick={() => setOpenMintModal(true)}
                    disabled={!activeAddress}
                  >
                    Launch Flow
                  </button>
                  <a href="#proof" className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-200/80">
                    See Flow
                  </a>
                </div>
              </article>

              <article className="group rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40 transition hover:border-rose-400/60">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
                  <AiOutlineDeploymentUnit className="text-xl" />
                </div>
                <h4 className="text-lg font-semibold text-slate-100">Clear settlements</h4>
                <p className="mt-3 text-sm text-slate-300">
                  Run the ClearDeals ARC-4 contract end-to-end: we auto-fund the app account, assign the operator, and log a vetted invoice
                  with attestations and ARC-28 proof events.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-slate-900/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">
                  Updated Oct 27 2025
                </div>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300" />
                    <span>
                      Auto-funding helper tops up the app before every call, preventing the minimum-balance failures we hit in QA.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300" />
                    <span>Duplicate-invoice guard and ARC-28 events now ship with fresh explorer receipts for the Oct 27 demo run.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300" />
                    <span>Vitest and E2E coverage validate operator rotation, settlement history lookups, and React modal logging.</span>
                  </li>
                </ul>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeAddress ? 'bg-amber-400 text-slate-950 hover:bg-amber-300' : 'bg-slate-800 text-slate-500'
                    }`}
                    onClick={() => setOpenAppCallsModal(true)}
                    disabled={!activeAddress}
                  >
                    Launch Flow
                  </button>
                  <a href="#proof" className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-200/80">
                    View Proof
                  </a>
                </div>
              </article>
            </div>

            {!activeAddress && (
              <div className="mt-8 rounded-2xl border border-slate-800/70 bg-slate-900/80 p-4 text-center text-sm text-slate-400">
                Connect your wallet to activate live dApp flows. Proof links remain available without signing in.
              </div>
            )}
          </section>

          {/* ---------------- Payment Readiness ---------------- */}
          <section className="border-y border-slate-800/60 bg-slate-950/70">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-rose-200/80">Payment readiness</p>
                <h4 className="mt-2 text-lg font-semibold text-slate-100">Fiat on-ramps plus Algorand-native trust</h4>
              </div>
              <div className="flex flex-1 flex-wrap justify-end gap-3">
                <span className="rounded-full border border-slate-800/60 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                  Stripe Test Mode
                </span>
                <span className="rounded-full border border-slate-800/60 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-rose-200">
                  ALGO + USDCa
                </span>
                <span className="rounded-full border border-slate-800/60 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-rose-300">
                  Opt-in Helper
                </span>
                <span className="rounded-full border border-slate-800/60 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                  Atomic Transfers
                </span>
              </div>
            </div>
          </section>

          {/* ---------------- Founder Notes ---------------- */}
          <section id="contact" className="mx-auto w-full max-w-6xl px-6 py-16">
            <div className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-10 shadow-xl shadow-slate-950/40">
              <p className="text-xs uppercase tracking-[0.35em] text-rose-200/80">Founder notes</p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-100">What&apos;s happening next</h3>
              <ul className="mt-6 space-y-4 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-rose-400" />
                  <span>
                    Founder-led marketing cadence: LinkedIn recap, Algorand + Harvard i-lab Slack updates, and 2-min explorer Loom ahead of
                    November submissions.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-rose-300" />
                  <span>Pilot outreach: DAO consultant and SOCH StudentOrg ops reviews queued to support letters of intent.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                  <span>
                    Analytics instrumentation: syncing wallet connects, SOCO door timestamps, and explorer proof clicks for challenge judge
                    packets.
                  </span>
                </li>
              </ul>
              <div className="mt-6 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-rose-200/80">Next interviews</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  <li className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-rose-400" />
                    <span>
                      Book DAO accessibility consultant slot during Tue/Thu 10-12 ET virtual hours to map accommodation workflows.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-rose-300" />
                    <span>
                      Meet SOCH StudentOrg operations leads on CampusGroups/SOCO processes, finance approvals, and space bookings.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                    <span>
                      Line up student media and performance org follow-ups (WHRB, The Crimson, Hasty Pudding) once privacy guardrails clear
                      introductions.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">
                  Need to compare notes or schedule a pilot review? Use the contact link to secure time.
                </p>
                <a
                  href="mailto:justinh@alumni.harvard.edu?subject=Joltkin%20Algorand%20Pilot%20Inquiry&body=Hi%20Justin%2C%0A%0AI%27d%20like%20to%20learn%20more%20about%20the%20Joltkin%20Algorand%20Pilot.%0A%0ABest%2C%0A[Your%20Name]"
                  className="inline-flex items-center justify-center rounded-full border border-rose-500/60 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:border-rose-300/80"
                >
                  Contact
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>

      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
      <Transact openModal={openPaymentModal} setModalState={setOpenPaymentModal} />
      <NFTmint openModal={openMintModal} setModalState={setOpenMintModal} />
      <Tokenmint openModal={openTokenModal} setModalState={setOpenTokenModal} />
      <AppCalls openModal={openAppCallsModal} setModalState={setOpenAppCallsModal} />
    </div>
  )
}

export default Home
