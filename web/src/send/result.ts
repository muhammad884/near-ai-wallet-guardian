export type Outcome = {
  state: 'SUCCESS' | 'FAILED' | 'UNKNOWN'
  hash: string | null
}

function rec(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null
    ? (v as Record<string, unknown>)
    : null
}

export function readResult(result: unknown): Outcome {
  const first = Array.isArray(result) ? result[0] : result
  const o = rec(first)
  if (!o) return { state: 'UNKNOWN', hash: null }

  const h1 = rec(o.transaction)?.hash
  const h2 = rec(o.transaction_outcome)?.id
  const hash = typeof h1 === 'string' ? h1 : typeof h2 === 'string' ? h2 : null

  const status = rec(o.status)
  if (status && status.Failure !== undefined) return { state: 'FAILED', hash }
  if (status && ('SuccessValue' in status || 'SuccessReceiptId' in status)) {
    return { state: 'SUCCESS', hash }
  }
  return { state: 'UNKNOWN', hash }
}

export function countsAsSpent(state: Outcome['state']): boolean {
  return state !== 'FAILED'
}
