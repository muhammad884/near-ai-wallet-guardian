import { useEffect, useState } from 'react'
import { parseKeys } from './keys'
import type { KeyAudit } from './keys'

const RPC = 'https://rpc.testnet.near.org'

function label(k: KeyAudit['keys'][number]): string {
  if (k.kind === 'FULL_ACCESS') {
    return 'Full access: can do anything. Never give this to an agent.'
  }
  if (k.kind === 'FUNCTION_CALL') {
    const where = k.receiver || 'one contract'
    const what = k.methods.length > 0 ? k.methods.join(', ') : 'any method'
    return `Can only call ${where} (${what}). Cannot attach NEAR.`
  }
  return 'Unknown permission type.'
}

export function KeyAuditCard({ account }: { account: string }) {
  const [audit, setAudit] = useState<KeyAudit | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(RPC, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'view_access_key_list',
          finality: 'final',
          account_id: account,
        },
      }),
    })
      .then((r) => r.json())
      .then((json: unknown) => {
        if (cancelled) return
        const parsed = parseKeys(json)
        if (parsed) setAudit(parsed)
        else setError('The network answered, but not with a key list.')
      })
      .catch(() => {
        if (!cancelled) setError('Could not reach the NEAR testnet RPC.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [account])

  return (
    <div>
      <h2 style={{ fontSize: 17, margin: '24px 0 10px' }}>Keys on this account (read-only)</h2>
      <div className="card">
        <span className="tag-demo">LIVE FROM TESTNET RPC</span>
        {loading && <p className="muted">Loading...</p>}
        {error && <p className="bad">{error}</p>}
        {audit && (
          <div>
            <div className="row">
              <span>Full-access keys</span>
              <strong className={audit.fullAccess > 0 ? 'mid' : 'ok'}>{audit.fullAccess}</strong>
            </div>
            <div className="row">
              <span>Function-call keys</span>
              <strong>{audit.functionCall}</strong>
            </div>
            <div className="row">
              <span>Other</span>
              <strong>{audit.other}</strong>
            </div>
            {audit.keys.map((k) => (
              <div className="row" key={k.publicKey}>
                <span>
                  {k.publicKey.slice(0, 18)}...
                  <br />
                  <span className="muted">{label(k)}</span>
                </span>
                <strong>{k.kind}</strong>
              </div>
            ))}
          </div>
        )}
        <p className="muted" style={{ fontSize: 14 }}>
          Read-only. This app does not add, remove or change any key. Your
          own full-access key is normal. The risk is giving one to an agent.
        </p>
      </div>
    </div>
  )
}
