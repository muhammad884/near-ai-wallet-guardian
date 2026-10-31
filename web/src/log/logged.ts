import { evaluate } from '../policy/engine'
import type { Policy, Result, TxRequest, Usage } from '../policy/types'
import { addEvent } from './store'

export function evaluateAndLog(
  policy: Policy,
  agentEnabled: boolean,
  tx: TxRequest,
  usage: Usage,
): Result {
  const r = evaluate(policy, agentEnabled, tx, usage)
  addEvent({
    source: 'Spending Limits',
    summary:
      `${tx.amount} NEAR to ${tx.receiver}` +
      (tx.method ? ` (${tx.method})` : ''),
    outcome: r.decision,
    tone:
      r.decision === 'APPROVED' ? 'ok'
      : r.decision === 'BLOCKED' ? 'bad'
      : 'mid',
  })
  return r
}
