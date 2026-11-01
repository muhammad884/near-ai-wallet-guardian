import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { evaluateAndLog } from './log/logged'
import { buildPolicy } from './policy/config'
import type { PolicyInput } from './policy/config'
import type { Policy, Result, Usage } from './policy/types'

const usage: Usage = { totalToday: 12, agentToday: 6 }

const start: PolicyInput = {
  maxPerTx: '10',
  maxDaily: '50',
  maxPerAgentDaily: '20',
  approvalAbove: '5',
  contracts: 'wrap.near',
  methods: 'ft_transfer',
  restricted: 'delete_account',
}

function firstPolicy(): Policy {
  const r = buildPolicy(start)
  if (!r.ok) throw new Error(r.error)
  return r.policy
}

export function Limits() {
  const [form, setForm] = useState<PolicyInput>(start)
  const [policy, setPolicy] = useState<Policy>(firstPolicy)
  const [formError, setFormError] = useState('')
  const [amount, setAmount] = useState('2')
  const [receiver, setReceiver] = useState('wrap.near')
  const [method, setMethod] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [checkError, setCheckError] = useState('')
  const [result, setResult] = useState<Result | null>(null)

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
    setPolicy(r.policy)
    setResult(null)
  }

  function check() {
    if (amount.trim() === '') {
      setCheckError('Enter an amount.')
      return
    }
    setCheckError('')
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
        Set your own limits and test transactions against them. This runs
        the policy engine in your browser. Enforced by: this app only. It
        shows a decision and does not block anything on the blockchain.
        Today&apos;s spending (12 NEAR) is a fixed demo value.
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
          <div className={'big ' + cls}>{result.decision}</div>
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
