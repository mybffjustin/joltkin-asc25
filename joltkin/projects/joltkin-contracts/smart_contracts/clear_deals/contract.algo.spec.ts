import { Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { beforeEach, describe, expect, it } from 'vitest'
import { ClearDeals } from './contract.algo'

describe('ClearDeals contract', () => {
  const ctx = new TestExecutionContext()

  beforeEach(() => {
    ctx.reset()
  })

  it('allows the operator to rotate control while blocking outsiders', () => {
    const contract = ctx.contract.create(ClearDeals)

    const beforeStats = contract.getSettlementStats()
    console.log('before operator bytes', beforeStats.operator.native.bytes)

    const originalOperator = ctx.defaultSender
    contract.setOperator(originalOperator)

    const statsAfterSetup = contract.getSettlementStats()
    expect(statsAfterSetup.operator.native.bytes).toEqual(originalOperator.bytes)

    const outsider = ctx.any.account()
    ctx.defaultSender = outsider
    const nextOperator = ctx.any.account()
    expect(() => contract.setOperator(nextOperator)).toThrowError('caller is not operator')

    ctx.defaultSender = originalOperator
    contract.setOperator(nextOperator)
    const statsAfterRotation = contract.getSettlementStats()
    expect(statsAfterRotation.operator.native.bytes).toEqual(nextOperator.bytes)
  })

  it('records clear settlements and updates running totals', () => {
    const contract = ctx.contract.create(ClearDeals)

    const operator = ctx.defaultSender
    contract.setOperator(operator)

    const payer = ctx.any.account()
    const payee = ctx.any.account()
    const supportingAssetId = Uint64(1739605)
    const firstAmount = Uint64(85_000)
    const firstPayment = ctx.any.txn.payment({ sender: payer, receiver: payee, amount: firstAmount })

    const firstTotal = contract.recordSettlement(
      'INV-2401',
      payer,
      payee,
      firstAmount,
      supportingAssetId,
      'bafy-transcript-proof-1',
      firstPayment,
    )

    expect(firstTotal).toEqual(Uint64(1))

    const secondAmount = Uint64(120_000)
    const secondPayment = ctx.any.txn.payment({ sender: payer, receiver: payee, amount: secondAmount })
    const secondTotal = contract.recordSettlement(
      'INV-2402',
      payer,
      payee,
      secondAmount,
      supportingAssetId,
      'bafy-transcript-proof-2',
      secondPayment,
    )

    expect(secondTotal).toEqual(Uint64(2))

    const stats = contract.getSettlementStats()
    const expectedRelease = Uint64(firstAmount + secondAmount)
    expect(stats.recordedCount.native).toEqual(Uint64(2))
    expect(stats.releasedMicroAlgos.native).toEqual(expectedRelease)
    expect(stats.latestAttestationCid.native).toEqual('bafy-transcript-proof-2')
    expect(stats.operator.native.bytes).toEqual(operator.bytes)

    const proof = contract.getLatestSettlementProof()
    expect(proof.invoiceId.native).toEqual('INV-2402')
    expect(proof.payer.native.bytes).toEqual(payer.bytes)
    expect(proof.payee.native.bytes).toEqual(payee.bytes)
    expect(proof.amount.native).toEqual(secondAmount)
    expect(proof.attestationCid.native).toEqual('bafy-transcript-proof-2')
    expect(proof.supportingAssetId.native).toEqual(supportingAssetId)
    expect(proof.recordedAtRound.native).toBeGreaterThanOrEqual(0)
  })

  it('blocks duplicate invoice identifiers to preserve audit integrity', () => {
    const contract = ctx.contract.create(ClearDeals)

    const operator = ctx.defaultSender
    contract.setOperator(operator)

    const payee = ctx.any.account()
    const amount = Uint64(15_000)
    contract.demoRecordSettlement('INV-duplicate', payee, amount, 'bafy-proof-1')

    expect(() => contract.demoRecordSettlement('INV-duplicate', payee, amount, 'bafy-proof-2')).toThrowError(
      'invoice already recorded',
    )
  })

  it('rejects settlement attempts when the caller is not the operator', () => {
    const contract = ctx.contract.create(ClearDeals)

    const payer = ctx.any.account()
    const payee = ctx.any.account()
    const amount = Uint64(42_000)
    const payment = ctx.any.txn.payment({ sender: payer, receiver: payee, amount })

    expect(() =>
      contract.recordSettlement('INV-unauthorized', payer, payee, amount, Uint64(0), 'cid', payment),
    ).toThrowError('operator not set')
  })

  it('supports demo settlement logging for front-end walkthroughs', () => {
    const contract = ctx.contract.create(ClearDeals)

    const operator = ctx.defaultSender
    contract.setOperator(operator)

    const payee = ctx.any.account()
    const recorded = contract.demoRecordSettlement('INV-demo', payee, Uint64(15_000), 'bafy-demo-proof')

    expect(recorded).toEqual(Uint64(1))

    const proof = contract.getLatestSettlementProof()
    expect(proof.invoiceId.native).toEqual('INV-demo')
    expect(proof.payee.native.bytes).toEqual(payee.bytes)
    expect(proof.payer.native.bytes).toEqual(operator.bytes)
    expect(proof.amount.native).toEqual(Uint64(15_000))
    expect(proof.attestationCid.native).toEqual('bafy-demo-proof')
  })
})
