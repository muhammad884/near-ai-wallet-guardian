import { useState } from 'react'
import { decideAndLog } from '../log/decided'
import type { PolicyDecision } from '../policy/decide'

export function Scanner() {
  const [amount, setAmount] = useState('2')
  const [receiver, setReceiver] = useState('wrap.near')
  const [method, setMethod] = useState('')
  const [args, setArgs] = useState('')
  const [result, setResult] = useState<PolicyDecision | null>(null)

  function run() {
    setResult(
      decideAndLog(
        'Transaction Scanner',
        {
          agentId: 'demo-agent',
          receiver: receiver.trim(),
          amount: Number(amount),
          method: method.trim() || undefined,
          args: args.trim() || undefined,
        },
        'risk',
      ),
    )
  }

  const cls =
    result?.level === 'LOW' ? 'ok'
    : result?.level === 'MEDIUM' ? 'mid'
    : 'bad'

  return (
    <div>
      <h1>Transaction Scanner</h1>
      <p className="muted">
        Scores a transaction from 0 to 100 using fixed, visible rules and
        the policy you applied on Spending Limits. It only looks at the
        information you type here. It does not read the blockchain and does
        not prove a transaction is safe.
      </p>

      <div className="card" style={{ marginTop: 16 }}>
        <label className="muted">Amount (NEAR)</label>
        <input className="field" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        <label className="muted">Receiver account</label>
        <input className="field" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
        <label className="muted">Method (optional)</label>
        <input className="field" value={method} onChange={(e) => setMethod(e.target.value)} placeholder="ft_transfer" />
        <label className="muted">Arguments (optional)</label>
        <input className="field" value={args} onChange={(e) => setArgs(e.target.value)} placeholder='{"key":"value"}' />
        <button className="btn" onClick={run}>Scan transaction</button>
      </div>

      {result && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className={'big ' + cls}>
            {result.score}/100 · {result.level}
          </div>
          <div className="muted" style={{ margin: '6px 0 10px' }}>
            Policy decision (app-level, nothing happens on chain): {result.verdict}
          </div>
          {result.verdict !== 'APPROVED' &&
            result.reasons.map((x) => (
              <div className="row" key={x}>{x}</div>
            ))}
          {result.findings.length === 0 && (
            <div className="row">No warning signs found in the information you entered.</div>
          )}
          {result.findings.map((f) => (
            <div className="row" key={f.text}>
              <span>{f.text}</span>
              <strong>+{f.points}</strong>
            </div>
          ))}
          <div className="row"><strong>{result.recommendation}</strong></div>
        </div>
      )}
    </div>
  )
}
