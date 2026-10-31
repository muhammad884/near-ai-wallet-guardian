import type { Policy, Result, TxRequest, Usage } from './types'

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

  if (!Number.isFinite(tx.amount) || tx.amount < 0) {
    blocks.push('The amount is not a valid number.')
  } else {
    if (tx.amount > policy.maxPerTx) {
      blocks.push(`Amount ${tx.amount} NEAR is above the per-transaction limit of ${policy.maxPerTx}.`)
    }
    if (usage.totalToday + tx.amount > policy.maxDaily) {
      blocks.push(`This would bring total spending today above the daily limit of ${policy.maxDaily} NEAR.`)
    }
    if (usage.agentToday + tx.amount > policy.maxPerAgentDaily) {
      blocks.push(`This would bring this agent's spending today above its limit of ${policy.maxPerAgentDaily} NEAR.`)
    }
    if (tx.amount > policy.approvalAbove) {
      approvals.push(`Amount ${tx.amount} NEAR is above ${policy.approvalAbove} NEAR, so the owner must approve it.`)
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
