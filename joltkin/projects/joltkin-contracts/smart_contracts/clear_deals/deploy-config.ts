import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { ClearDealsFactory } from '../artifacts/clear_deals/ClearDealsClient'

// Below is a showcase of various deployment options you can use in TypeScript Client
export async function deploy() {
  console.log('=== Deploying Clear Deals ===')

  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  const factory = algorand.client.getTypedAppFactory(ClearDealsFactory, {
    defaultSender: deployer.addr,
  })

  const { appClient, result } = await factory.deploy({ onUpdate: 'append', onSchemaBreak: 'append' })

  if (['create', 'replace'].includes(result.operationPerformed)) {
    await algorand.send.payment({
      amount: (1).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    })
  }

  await appClient.send.setOperator({
    args: { operator: String(deployer.addr) },
  })

  const invoiceId = `INV-JOLT-${Date.now()}`
  const attestationCid = 'bafy-jolt-settlement-demo'
  const payee = String(deployer.addr)
  const amount = 150_000

  await appClient.send.demoRecordSettlement({
    args: {
      invoiceId,
      payee,
      expectedAmount: amount,
      attestationCid,
    },
  })

  const stats = await appClient.send.getSettlementStats({ args: {} })
  const proof = await appClient.send.getLatestSettlementProof({ args: {} })

  console.log('Settlement stats', stats.return)
  console.log('Latest settlement proof', proof.return)
}
