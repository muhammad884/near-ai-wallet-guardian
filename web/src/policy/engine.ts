import type { Policy, Result, TxRequest, Usage } from './types'
import { decimalToYocto, yoctoToDecimal } from './amount.ts'

export function evaluate(
  policy: Policy,
  agentEnabled: boolean,
  tx: TxRequest,
  usage: Usage,
): Result {
  const blocks: string[] = []
  const approvals: string[] = []

  if (!agentEnabled) {
    blocks.push('The agent is disabled.')
  }

  const amount = decimalToYocto(tx.amountText ?? tx.amount)
  const maxTx = decimalToYocto(policy.maxPerTxExact ?? policy.maxPerTx)
  const daily = decimalToYocto(policy.maxDailyExact ?? policy.maxDaily)
  const agentDaily = decimalToYocto(policy.maxPerAgentDailyExact ?? policy.maxPerAgentDaily)
  const approval = decimalToYocto(policy.approvalAboveExact ?? policy.approvalAbove)
  const total = decimalToYocto(usage.totalTodayExact ?? usage.totalToday)
  const agentTotal = decimalToYocto(usage.agentTodayExact ?? usage.agentToday)

  if (
    amount === null || amount < 0n ||
    maxTx === null || daily === null ||
    agentDaily === null || approval === null ||
    total === null || agentTotal === null
  ) {
    blocks.push('The amount or policy limits are invalid.')
  } else {
    if (amount > maxTx) {
      blocks.push(`Amount ${yoctoToDecimal(amount)} NEAR is above the per-transaction limit of ${yoctoToDecimal(maxTx)}.`)
    }

    if (total + amount > daily) {
      blocks.push(`This would bring total spending today above the daily limit of ${yoctoToDecimal(daily)} NEAR.`)
    }

    if (agentTotal + amount > agentDaily) {
      blocks.push(`This would bring this agent's spending today above its limit of ${yoctoToDecimal(agentDaily)} NEAR.`)
    }

    if (amount > approval) {
      approvals.push(`Amount ${yoctoToDecimal(amount)} NEAR is above ${yoctoToDecimal(approval)} NEAR, so the owner must approve it.`)
    }
  }

  if (tx.method) {
    if (policy.restrictedMethods.includes(tx.method)) {
      blocks.push(`The method "${tx.method}" is restricted.`)
    }

    if (!policy.allowedContracts.includes(tx.receiver)) {
      blocks.push(`The contract "${tx.receiver}" is not on the allowed list.`)
    }

    if (!policy.allowedMethods.includes(tx.method)) {
      blocks.push(`The method "${tx.method}" is not on the allowed list.`)
    }
  }

  if (blocks.length > 0) {
    return { decision: 'BLOCKED', reasons: blocks }
  }

  if (approvals.length > 0) {
    return { decision: 'REQUIRES_APPROVAL', reasons: approvals }
  }

  return { decision: 'APPROVED', reasons: ['All policy checks passed.'] }
}
