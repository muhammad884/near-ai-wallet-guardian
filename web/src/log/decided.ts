import { decide } from '../policy/decide.ts'
import type { PolicyDecision } from '../policy/decide.ts'
import type { ScanInput } from '../scanner/risk.ts'
import { addEvent } from './store'

export function decideAndLog(
  source: string,
  tx: ScanInput,
  style: 'verdict' | 'risk',
  summary?: string,
  agentEnabled?: boolean,
): PolicyDecision {
  const d = decide(tx, { agentEnabled: agentEnabled ?? true })
  const tone =
    style === 'verdict'
      ? d.verdict === 'APPROVED' ? 'ok' : d.verdict === 'BLOCKED' ? 'bad' : 'mid'
      : d.level === 'LOW' ? 'ok' : d.level === 'MEDIUM' ? 'mid' : 'bad'
  addEvent({
    source,
    summary:
      summary ??
      `${tx.amount} NEAR to ${tx.receiver}` + (tx.method ? ` (${tx.method})` : ''),
    outcome: style === 'verdict' ? d.verdict : `${d.score}/100 ${d.level}`,
    tone,
  })
  return d
}
