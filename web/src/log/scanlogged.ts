import { scan } from '../scanner/risk'
import type { ScanInput, ScanResult } from '../scanner/risk'
import type { Policy, Usage } from '../policy/types'
import { addEvent } from './store'

export function scanAndLog(
  policy: Policy,
  agentEnabled: boolean,
  tx: ScanInput,
  usage: Usage,
): ScanResult {
  const r = scan(policy, agentEnabled, tx, usage)
  addEvent({
    source: 'Transaction Scanner',
    summary:
      `${tx.amount} NEAR to ${tx.receiver}` +
      (tx.method ? ` (${tx.method})` : ''),
    outcome: `${r.score}/100 ${r.level}`,
    tone: r.level === 'LOW' ? 'ok' : r.level === 'MEDIUM' ? 'mid' : 'bad',
  })
  return r
}
