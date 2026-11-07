import { evaluate } from '../policy/engine.ts'
import type { Policy, Result, TxRequest, Usage } from '../policy/types'
import { decimalToYocto } from '../policy/amount.ts'

export type Level = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type Finding = { points: number; text: string }

export type ScanInput = TxRequest & { args?: string }

export type ScanResult = {
  score: number
  level: Level
  findings: Finding[]
  policy: Result
  recommendation: string
}

const SENSITIVE = [
  'add_key', 'add_full_access_key', 'delete_key', 'delete_account',
  'deploy_contract', 'set_owner', 'transfer_ownership',
]

const ACCOUNT_ID = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/

export function scan(
  policy: Policy,
  agentEnabled: boolean,
  tx: ScanInput,
  usage: Usage,
): ScanResult {
  const findings: Finding[] = []
  const add = (points: number, text: string) => findings.push({ points, text })

  const decision = evaluate(policy, agentEnabled, tx, usage)
  if (decision.decision === 'BLOCKED') {
    add(50, 'Your own policy blocks this transaction.')
  } else if (decision.decision === 'REQUIRES_APPROVAL') {
    add(20, 'Your policy requires your approval for this transaction.')
  }

  const id = tx.receiver
  if (id.length < 2 || id.length > 64 || !ACCOUNT_ID.test(id)) {
    add(25, 'The receiver is not a valid NEAR account ID format.')
  }

  if (tx.method && SENSITIVE.some((m) => tx.method!.toLowerCase().includes(m))) {
    add(40, `The method "${tx.method}" looks like a key or account management action.`)
  }

  if (tx.args) {
    const a = tx.args.toLowerCase()
    if (a.includes('full_access') || a.includes('fullaccess') || a.includes('public_key')) {
      add(20, 'The arguments mention full access or a public key.')
    }
  }

  const amount = decimalToYocto(tx.amountText ?? tx.amount)
  const maxPerTx = decimalToYocto(policy.maxPerTxExact ?? policy.maxPerTx)
  if (amount !== null && maxPerTx !== null && amount * 10n >= maxPerTx * 8n) {
    add(10, 'The amount is close to or above your per-transaction limit.')
  }

  const score = Math.min(100, findings.reduce((s, f) => s + f.points, 0))
  const level: Level =
    score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW'

  const recommendation =
    level === 'LOW' ? 'Nothing suspicious in what you typed. This is not proof the transaction is safe.'
    : level === 'MEDIUM' ? 'Check the details yourself before approving.'
    : level === 'HIGH' ? 'Do not approve unless you fully understand every warning.'
    : 'Reject this transaction.'

  return { score, level, findings, policy: decision, recommendation }
}
