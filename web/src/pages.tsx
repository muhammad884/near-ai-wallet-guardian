import type { NavItem } from './nav'
import { useEvents } from './log/store'
import { useAgents } from './agents/store'
import { Link } from 'react-router-dom'
import { useWalletAccount } from './wallet/state'

export function Dashboard() {
  const events = useEvents()
  const agents = useAgents()
  const account = useWalletAccount()
  const bad = events.filter((e) => e.tone === 'bad').length
  const mid = events.filter((e) => e.tone === 'mid').length
  const stats = [
    { label: 'Decisions this session', value: String(events.length) },
    { label: 'Blocked or high risk', value: String(bad) },
    { label: 'Needs attention', value: String(mid) },
    { label: 'Active agents', value: String(agents.filter((a) => a.enabled).length) },
  ]
  const recent = events.slice(0, 5)

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">
        These numbers come from the decisions made in this browser tab and
        reset when you refresh the page. Active agents counts the profiles registered on the AI Agents page, not connected software. No wallet data is read here.
      </p>
      <div className="card" style={{ marginTop: 16 }}>
        <span className="tag-demo">TESTNET</span>
        <div className="row">
          <span>Wallet</span>
          <strong className={account ? 'ok' : 'mid'}>
            {account ? 'Connected' : account === null ? 'Not connected' : 'Not checked yet'}
          </strong>
        </div>
        <div className="row">
          <span>Account</span>
          <strong>{account ?? 'none'}</strong>
        </div>
        <p className="muted">
          As of your last visit to Wallet Security in this session. This
          page cannot see your wallet directly.
        </p>
        <Link className="btn" to={account ? '/wallet' : '/wallet#connect'} style={{ textAlign: 'center', textDecoration: 'none' }}>
          {account ? 'Manage wallet' : 'Connect wallet'}
        </Link>
      </div>
      <div className="grid">
        {stats.map((s) => (
          <div className="card" key={s.label}>
            <div className="muted">{s.label}</div>
            <div className="big">{s.value}</div>
          </div>
        ))}
      </div>
      <h2>Recent decisions</h2>
      <div className="card">
        {recent.length === 0 && (
          <p className="muted">
            Nothing yet. Run a check on Spending Limits, Transaction Scanner
            or Scam Detector.
          </p>
        )}
        {recent.map((e) => (
          <div className="row" key={e.id}>
            <span>{e.source}: {e.summary}<br /><span className="muted">{e.time.slice(0, 19).replace('T', ' ')} UTC</span></span>
            <strong className={e.tone}>{e.outcome}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Placeholder({ item }: { item: NavItem }) {
  return (
    <div>
      <h1>{item.label}</h1>
      <p className="muted">{item.desc}</p>
      <div className="card" style={{ marginTop: 16 }}>
        <span className="tag-demo">NOT BUILT YET</span>
        <p>This page is planned for {item.stage}. No real functionality exists here yet.</p>
      </div>
    </div>
  )
}
