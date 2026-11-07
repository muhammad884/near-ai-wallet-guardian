import { scan } from '../scanner/risk.ts'
import type { ScanInput, ScanResult } from '../scanner/risk.ts'
import { getActivePolicy } from './active.ts'
import { getAgentSentTotal, getSentTotal, getAgentSentTotalExact, getSentTotalExact } from '../send/session.ts'
import type { Decision as Verdict, Policy, Usage } from './types'

export type PolicyDecision = ScanResult & {
  verdict: Verdict
  rejected: boolean
  reasons: string[]
  rules: string[]
}

export function currentUsage(agentId = 'you'): Usage {
  const sent = getSentTotal()
  const agentSent = getAgentSentTotal(agentId)
  const totalExact = getSentTotalExact()
  const agentExact = getAgentSentTotalExact(agentId)

  const usage: Usage = {
    totalToday: sent,
    agentToday: agentSent,
  }

  if (totalExact !== String(sent) || agentExact !== String(agentSent)) {
    usage.totalTodayExact = totalExact
    usage.agentTodayExact = agentExact
  }

  return usage
}

export function describeRules(p: Policy): string[] {
  return [
    `Max ${p.maxPerTxExact ?? p.maxPerTx} NEAR per transaction`,
    `Max ${p.maxDailyExact ?? p.maxDaily} NEAR per day`,
    `Max ${p.maxPerAgentDailyExact ?? p.maxPerAgentDaily} NEAR per agent per day`,
    `Owner approval needed above ${p.approvalAboveExact ?? p.approvalAbove} NEAR`,
    `Allowed contracts: ${p.allowedContracts.join(', ') || 'none'}`,
    `Allowed methods: ${p.allowedMethods.join(', ') || 'none'}`,
    `Restricted methods: ${p.restrictedMethods.join(', ')}`,
  ]
}

export function decide(
  tx: ScanInput,
  opts: { policy?: Policy; agentEnabled?: boolean; usage?: Usage } = {},
): PolicyDecision {
  const policy = opts.policy ?? getActivePolicy()
  const usage = opts.usage ?? currentUsage(tx.agentId)
  const r = scan(policy, opts.agentEnabled ?? true, tx, usage)
  return {
    ...r,
    verdict: r.policy.decision,
    rejected: r.policy.decision === 'BLOCKED',
    reasons: r.policy.reasons,
    rules: describeRules(policy),
  }
}

export function mayRequestSignature(
  verdict: Verdict,
  ownerConfirmed: boolean,
): boolean {
  if (verdict === 'BLOCKED') return false
  if (verdict === 'REQUIRES_APPROVAL') return ownerConfirmed
  return true
}
