import {
  Account,
  BoxMap,
  Bytes,
  Global,
  GlobalState,
  Uint64,
  arc4,
  assert,
  emit,
  gtxn,
  type Account as AccountType,
  type bytes,
  type uint64,
  Txn,
} from '@algorandfoundation/algorand-typescript'

type SettlementLoggedEvent = {
  invoiceId: arc4.Str
  payer: arc4.Address
  payee: arc4.Address
  amount: arc4.UintN64
  attestationCid: arc4.Str
  supportingAssetId: arc4.UintN64
}

class SettlementStatsStruct extends arc4.Struct<{
  operator: arc4.Address
  recordedCount: arc4.UintN64
  releasedMicroAlgos: arc4.UintN64
  latestAttestationCid: arc4.Str
}> {}

class LatestSettlementProofStruct extends arc4.Struct<{
  invoiceId: arc4.Str
  payer: arc4.Address
  payee: arc4.Address
  amount: arc4.UintN64
  attestationCid: arc4.Str
  supportingAssetId: arc4.UintN64
  recordedAtRound: arc4.UintN64
}> {}

class StoredSettlement extends arc4.Struct<{
  invoiceId: arc4.Str
  payer: arc4.Address
  payee: arc4.Address
  amount: arc4.UintN64
  attestationCid: arc4.Str
  supportingAssetId: arc4.UintN64
  recordedAtRound: arc4.UintN64
}> {}

export class ClearDeals extends arc4.Contract {
  private readonly operator = GlobalState<bytes>({ key: Bytes('operator') })
  private readonly operatorAssigned = GlobalState<uint64>({ key: Bytes('operator_init'), initialValue: Uint64(0) })
  private readonly totalRecorded = GlobalState<uint64>({ key: Bytes('total'), initialValue: Uint64(0) })
  private readonly totalReleased = GlobalState<uint64>({ key: Bytes('released'), initialValue: Uint64(0) })
  private readonly latestAttestation = GlobalState<string>({ key: Bytes('cid'), initialValue: '' })
  private readonly lastInvoiceId = GlobalState<string>({ key: Bytes('inv'), initialValue: '' })
  private readonly lastPayer = GlobalState<bytes>({ key: Bytes('payer'), initialValue: Bytes('') })
  private readonly lastPayee = GlobalState<bytes>({ key: Bytes('payee'), initialValue: Bytes('') })
  private readonly lastAmount = GlobalState<uint64>({ key: Bytes('amt'), initialValue: Uint64(0) })
  private readonly lastAsset = GlobalState<uint64>({ key: Bytes('asset'), initialValue: Uint64(0) })
  private readonly lastRound = GlobalState<uint64>({ key: Bytes('round'), initialValue: Uint64(0) })
  private readonly settlements = BoxMap<string, StoredSettlement>({ keyPrefix: Bytes('s:') })

  @arc4.abimethod()
  public setOperator(operator: AccountType): void {
    if (this.operatorAssigned.value > Uint64(0)) {
      this.ensureOperator()
    }
    this.operator.value = operator.bytes
    this.operatorAssigned.value = Uint64(1)
  }

  @arc4.abimethod({ readonly: true })
  public getSettlementStats(): SettlementStatsStruct {
    const operatorAssigned = this.operatorAssigned.value > Uint64(0)
    const operatorAccount = operatorAssigned && this.operator.hasValue
      ? Account(this.operator.value)
      : Account()
    return new SettlementStatsStruct({
      operator: new arc4.Address(operatorAccount),
      recordedCount: new arc4.UintN64(this.totalRecorded.value),
      releasedMicroAlgos: new arc4.UintN64(this.totalReleased.value),
      latestAttestationCid: new arc4.Str(this.latestAttestation.value),
    })
  }

  @arc4.abimethod({ readonly: true })
  public getLatestSettlementProof(): LatestSettlementProofStruct {
    const invoice = this.lastInvoiceId.hasValue ? this.lastInvoiceId.value : ''
    const payer = this.lastPayer.hasValue ? Account(this.lastPayer.value) : Account()
    const payee = this.lastPayee.hasValue ? Account(this.lastPayee.value) : Account()
    return new LatestSettlementProofStruct({
      invoiceId: new arc4.Str(invoice),
      payer: new arc4.Address(payer),
      payee: new arc4.Address(payee),
      amount: new arc4.UintN64(this.lastAmount.value),
      attestationCid: new arc4.Str(this.latestAttestation.value),
      supportingAssetId: new arc4.UintN64(this.lastAsset.value),
      recordedAtRound: new arc4.UintN64(this.lastRound.value),
    })
  }

  @arc4.abimethod()
  public recordSettlement(
    invoiceId: string,
    payer: AccountType,
    payee: AccountType,
    expectedAmount: uint64,
    supportingAssetId: uint64,
    attestationCid: string,
    paymentTxn: gtxn.PaymentTxn,
  ): uint64 {
    this.ensureOperator()
    this.validateInvoice(invoiceId)
    this.validateAttestation(attestationCid)
    this.ensurePositiveAmount(expectedAmount)
    assert(paymentTxn.sender.bytes.equals(payer.bytes), 'payer mismatch')
    assert(paymentTxn.receiver.bytes.equals(payee.bytes), 'payee mismatch')
    assert(paymentTxn.amount === expectedAmount, 'amount mismatch')

    return this.storeSettlement({
      invoiceId,
      payer,
      payee,
      amount: expectedAmount,
      supportingAssetId,
      attestationCid,
    })
  }

  @arc4.abimethod()
  public demoRecordSettlement(
    invoiceId: string,
    payee: AccountType,
    expectedAmount: uint64,
    attestationCid: string,
  ): uint64 {
    this.ensureOperator()
    this.validateInvoice(invoiceId)
    this.validateAttestation(attestationCid)
    this.ensurePositiveAmount(expectedAmount)

    const payer = Txn.sender
    return this.storeSettlement({
      invoiceId,
      payer,
      payee,
      amount: expectedAmount,
      supportingAssetId: Uint64(0),
      attestationCid,
    })
  }

  public hello(name: string): string {
    return `Clear deals ready for ${name}`
  }

  private ensureOperator(): void {
    assert(this.operatorAssigned.value > Uint64(0), 'operator not set')
    assert(Txn.sender.bytes.equals(this.operator.value), 'caller is not operator')
  }

  private validateInvoice(invoiceId: string): void {
    assert(invoiceId !== '', 'invoice required')
  }

  private validateAttestation(attestationCid: string): void {
    assert(attestationCid !== '', 'attestation required')
  }

  private ensurePositiveAmount(amount: uint64): void {
    assert(amount > 0, 'expected amount required')
  }

  private storeSettlement(settlement: {
    invoiceId: string
    payer: AccountType
    payee: AccountType
    amount: uint64
    supportingAssetId: uint64
    attestationCid: string
  }): uint64 {
    const box = this.settlements(settlement.invoiceId)
    assert(!box.exists, 'invoice already recorded')

    const nextTotal = Uint64(this.totalRecorded.value + 1)
    const nextReleased = Uint64(this.totalReleased.value + settlement.amount)
    this.totalRecorded.value = nextTotal
    this.totalReleased.value = nextReleased
    this.latestAttestation.value = settlement.attestationCid
    this.lastInvoiceId.value = settlement.invoiceId
    this.lastPayer.value = settlement.payer.bytes
    this.lastPayee.value = settlement.payee.bytes
    this.lastAmount.value = settlement.amount
    this.lastAsset.value = settlement.supportingAssetId
    this.lastRound.value = Global.round

    const stored = new StoredSettlement({
      invoiceId: new arc4.Str(settlement.invoiceId),
      payer: new arc4.Address(settlement.payer),
      payee: new arc4.Address(settlement.payee),
      amount: new arc4.UintN64(settlement.amount),
      attestationCid: new arc4.Str(settlement.attestationCid),
      supportingAssetId: new arc4.UintN64(settlement.supportingAssetId),
      recordedAtRound: new arc4.UintN64(Global.round),
    })

    const encoded = stored.bytes
    box.create({ size: encoded.length })
    box.value = stored.copy()

    emit<SettlementLoggedEvent>({
      invoiceId: new arc4.Str(settlement.invoiceId),
      payer: new arc4.Address(settlement.payer),
      payee: new arc4.Address(settlement.payee),
      amount: new arc4.UintN64(settlement.amount),
      attestationCid: new arc4.Str(settlement.attestationCid),
      supportingAssetId: new arc4.UintN64(settlement.supportingAssetId),
    })

    return this.totalRecorded.value
  }
}

