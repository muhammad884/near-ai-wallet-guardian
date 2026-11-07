import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { decideAndLog } from './log/decided'
import { buildPolicy, policyToInput } from './policy/config'
import type { PolicyInput } from './policy/config'
import { getActivePolicy, setActivePolicy } from './policy/active'
import type { Policy } from './policy/types'

type Shown = { verdict: string; reasons: string[] }

export function Limits() {
  const [form, setForm] = useState<PolicyInput>(() => policyToInput(getActivePolicy()))
  const [policy, setPolicy] = useState<Policy>(() => getActivePolicy())
  const [formError, setFormError] = useState('')
  const [amount, setAmount] = useState('2')
  const [receiver, setReceiver] = useState('wrap.near')
  const [method, setMethod] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [checkError, setCheckError] = useState('')
  const [result, setResult] = useState<Shown | null>(null)

  function bind(key: keyof PolicyInput) {
    return {
      value: form[key],
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [key]: e.target.value }),
    }
  }

  function apply() {
    const r = buildPolicy(form)
    if (!r.ok) {
      setFormError(r.error)
      return
    }
    setFormError('')
    setActivePolicy(r.policy)
    setPolicy(r.policy)
    setResult(null)
  }

  function check() {
    if (amount.trim() === '') {
      setCheckError('Enter an amount.')
      return
    }
    setCheckError('')
    const d = decideAndLog(
      'Spending Limits',
      {
        agentId: 'demo-agent',
        receiver: receiver.trim(),
        amount: Number(amount),
        amountText: amount.trim(),
        method: method.trim() || undefined,
      },
      'verdict',
      undefined,
      enabled,
    )
    setResult({ verdict: d.verdict, reasons: d.reasons })
  }

  const cls =
    result?.verdict === 'APPROVED' ? 'ok'
    : result?.verdict === 'BLOCKED' ? 'bad'
    : 'mid'

  return (
    <div>
      <h1>Spending Limits</h1>
      <p className="muted">
        Set your own limits and test transactions against them. This runs
        the policy engine in your browser. Enforced by: this app only. It
        shows a decision and does not block anything on the blockchain.
        Daily limits count what you sent with Send NEAR today (UTC) in this browser, and your policy is saved in this browser. The Transaction Scanner
        and Send NEAR use the same policy. Allowed contracts and methods are
        checked only when a method is given (a contract call). A plain NEAR
        transfer is limited by the amount rules only.
      </p>

      <h2>Your policy</h2>
      <div className="card">
        <label className="muted">Max per transaction (NEAR)</label>
        <input className="field" inputMode="decimal" {...bind('maxPerTx')} />
        <label className="muted">Max per day (NEAR)</label>
        <input className="field" inputMode="decimal" {...bind('maxDaily')} />
        <label className="muted">Max per agent per day (NEAR)</label>
        <input className="field" inputMode="decimal" {...bind('maxPerAgentDaily')} />
        <label className="muted">Ask me to approve above (NEAR)</label>
        <input className="field" inputMode="decimal" {...bind('approvalAbove')} />
        <label className="muted">Allowed contracts (comma separated)</label>
        <input className="field" {...bind('contracts')} />
        <label className="muted">Allowed methods (comma separated)</label>
        <input className="field" {...bind('methods')} />
        <label className="muted">Restricted methods (comma separated)</label>
        <input className="field" {...bind('restricted')} />
        <p className="muted">
          add_key, add_full_access_key, delete_key and delete_account are
          always restricted.
        </p>
        {formError && <div className="bad">{formError}</div>}
        <button className="btn" onClick={apply}>Apply policy</button>
      </div>

      <h2>Policy in use</h2>
      <div className="card">
        <span className="tag-demo">APP-LEVEL ONLY</span>
        <div className="row"><span>Max per transaction</span><strong>{policy.maxPerTx} NEAR</strong></div>
        <div className="row"><span>Max per day</span><strong>{policy.maxDaily} NEAR</strong></div>
        <div className="row"><span>Max per agent per day</span><strong>{policy.maxPerAgentDaily} NEAR</strong></div>
        <div className="row"><span>Approval needed above</span><strong>{policy.approvalAbove} NEAR</strong></div>
        <div className="row"><span>Allowed contracts</span><span>{policy.allowedContracts.join(', ') || 'none'}</span></div>
        <div className="row"><span>Allowed methods</span><span>{policy.allowedMethods.join(', ') || 'none'}</span></div>
        <div className="row"><span>Restricted methods</span><span>{policy.restrictedMethods.join(', ')}</span></div>
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
        {checkError && <div className="bad">{checkError}</div>}
        <button className="btn" onClick={check}>Check transaction</button>
      </div>

      {result && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className={'big ' + cls}>{result.verdict}</div>
          <div className="muted">
            App-level decision only. Nothing was sent, and nothing was blocked
            on the blockchain.
          </div>
          {result.reasons.map((r) => (
            <div className="row" key={r}>{r}</div>
          ))}
        </div>
      )}
    </div>
  )
}
