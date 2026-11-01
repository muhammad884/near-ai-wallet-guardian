import { useState } from 'react'
import { makeAgent } from './model'
import { setAgents, useAgents } from './store'

export function Agents() {
  const agents = useAgents()
  const [name, setName] = useState('')
  const [maxPerTx, setMaxPerTx] = useState('5')
  const [maxDaily, setMaxDaily] = useState('20')
  const [approvalAbove, setApprovalAbove] = useState('2')
  const [contracts, setContracts] = useState('')
  const [methods, setMethods] = useState('')
  const [error, setError] = useState('')

  function create() {
    const r = makeAgent({ name, maxPerTx, maxDaily, approvalAbove, contracts, methods })
    if (!r.ok) {
      setError(r.error)
      return
    }
    setError('')
    setAgents([...agents, r.agent])
    setName('')
  }

  function toggle(id: string) {
    setAgents(agents.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)))
  }

  function remove(id: string) {
    setAgents(agents.filter((a) => a.id !== id))
  }

  return (
    <div>
      <h1>AI Agents</h1>
      <p className="muted">
        Register an agent and set its limits. These are settings inside this
        app only. They are NOT enforced on the blockchain yet, and the list
        is kept in memory, so it resets when you refresh the page.
      </p>

      <h2>New agent</h2>
      <div className="card">
        <label className="muted">Name</label>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Trader-1" />
        <label className="muted">Max per transaction (NEAR)</label>
        <input className="field" value={maxPerTx} onChange={(e) => setMaxPerTx(e.target.value)} inputMode="decimal" />
        <label className="muted">Max per day (NEAR)</label>
        <input className="field" value={maxDaily} onChange={(e) => setMaxDaily(e.target.value)} inputMode="decimal" />
        <label className="muted">Ask me to approve above (NEAR)</label>
        <input className="field" value={approvalAbove} onChange={(e) => setApprovalAbove(e.target.value)} inputMode="decimal" />
        <label className="muted">Allowed contracts (comma separated)</label>
        <input className="field" value={contracts} onChange={(e) => setContracts(e.target.value)} placeholder="wrap.near" />
        <label className="muted">Allowed methods (comma separated)</label>
        <input className="field" value={methods} onChange={(e) => setMethods(e.target.value)} placeholder="ft_transfer" />
        {error && <div className="bad">{error}</div>}
        <button className="btn" onClick={create}>Create agent</button>
      </div>

      <h2>Your agents</h2>
      {agents.length === 0 && <p className="muted">No agents yet.</p>}
      {agents.map((a) => (
        <div className="card" key={a.id} style={{ marginBottom: 12 }}>
          <div className="row">
            <strong>{a.name}</strong>
            <span className={a.enabled ? 'ok' : 'bad'}>{a.enabled ? 'ENABLED' : 'DISABLED'}</span>
          </div>
          <div className="row"><span>Per transaction</span><span>{a.maxPerTx} NEAR</span></div>
          <div className="row"><span>Per day</span><span>{a.maxDaily} NEAR</span></div>
          <div className="row"><span>Approval above</span><span>{a.approvalAbove} NEAR</span></div>
          <div className="row"><span>Contracts</span><span>{a.allowedContracts.join(', ') || 'none'}</span></div>
          <div className="row"><span>Methods</span><span>{a.allowedMethods.join(', ') || 'none'}</span></div>
          <button className="btn" onClick={() => toggle(a.id)}>{a.enabled ? 'Disable' : 'Enable'}</button>
          <button className="btn" onClick={() => remove(a.id)}>Remove from this app</button>
        </div>
      ))}
    </div>
  )
}
