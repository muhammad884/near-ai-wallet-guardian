import { useState } from 'react'
import { evaluateAndLog } from './log/logged'
import type { Policy, Result, Usage } from './policy/types'

const policy: Policy = {
  maxPerTx: 10,
  maxDaily: 50,
  maxPerAgentDaily: 20,
  approvalAbove: 5,
  allowedContracts: ['wrap.near'],
  allowedMethods: ['ft_transfer'],
  restrictedMethods: ['add_full_access_key', 'delete_account'],
}

const usage: Usage = { totalToday: 12, agentToday: 6 }

export function Limits() {
  const [amount, setAmount] = useState('2')
  const [receiver, setReceiver] = useState('wrap.near')
  const [method, setMethod] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [result, setResult] = useState<Result | null>(null)

  function check() {
    setResult(
      evaluateAndLog(
        policy,
        enabled,
        {
          agentId: 'demo-agent',
          receiver: receiver.trim(),
          amount: Number(amount),
          method: method.trim() || undefined,
        },
        usage,
      ),
    )
  }

  const cls =
    result?.decision === 'APPROVED' ? 'ok'
    : result?.decision === 'BLOCKED' ? 'bad'
    : 'mid'

  return (
    <div>
      <h1>Spending Limits</h1>
      <p className="muted">
        This runs the real policy engine in your browser. The policy and
        today&apos;s usage below are DEMO values. This page only shows a
        decision. It does not block anything on the blockchain yet.
      </p>

      <div className="card" style={{ marginTop: 16 }}>
        <span className="tag-demo">DEMO POLICY</span>
        <div className="row"><span>Max per transaction</span><strong>{policy.maxPerTx} NEAR</strong></div>
        <div className="row"><span>Max per day</span><strong>{policy.maxDaily} NEAR</strong></div>
        <div className="row"><span>Max per agent per day</span><strong>{policy.maxPerAgentDaily} NEAR</strong></div>
        <div className="row"><span>Approval needed above</span><strong>{policy.approvalAbove} NEAR</strong></div>
        <div className="row"><span>Spent today (demo)</span><strong>{usage.totalToday} NEAR</strong></div>
      </div>

      <h2>Try a transaction</h2>
      <div className="card">
        <label className="muted">Amount (NEAR)</label>
        <input className="field" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        <label className="muted">Receiver account</label>
        <input className="field" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
        <label className="muted">Method (leave empty for a plain transfer)</label>
        <input className="field" value={method} onChange={(e) => setMethod(e.target.value)} placeholder="ft_transfer" />
        <label className="muted">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Agent enabled
        </label>
        <button className="btn" onClick={check}>Check transaction</button>
      </div>

      {result && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className={'big ' + cls}>{result.decision}</div>
          {result.reasons.map((r) => (
            <div className="row" key={r}>{r}</div>
          ))}
        </div>
      )}
    </div>
  )
}
