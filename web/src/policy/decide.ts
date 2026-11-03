import { scan } from '../scanner/risk.ts'
import type { ScanInput, ScanResult } from '../scanner/risk.ts'
import { getActivePolicy } from './active.ts'
import { getSentTotal } from '../send/session.ts'
import type { Decision as Verdict, Policy, Usage } from './types'

export type PolicyDecision = ScanResult & {
  verdict: Verdict
  rejected: boolean
  reasons: string[]
  rules: string[]
}

export function currentUsage(): Usage {
  const sent = getSentTotal()
  return { totalToday: sent, agentToday: sent }
}

export function describeRules(p: Policy): string[] {
  return [
    `Max ${p.maxPerTx} NEAR per transaction`,
    `Max ${p.maxDaily} NEAR per day`,
    `Max ${p.maxPerAgentDaily} NEAR per agent per day`,
    `Owner approval needed above ${p.approvalAbove} NEAR`,
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
  const usage = opts.usage ?? currentUsage()
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
