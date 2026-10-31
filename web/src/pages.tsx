import type { NavItem } from './nav'

const stats = [
  { label: 'Wallet', value: 'Not connected' },
  { label: 'Active agents', value: '2' },
  { label: 'Pending approvals', value: '1' },
  { label: 'Blocked today', value: '3' },
]

const events = [
  { text: 'Agent "Trader-1" tried 40 NEAR (limit 10)', result: 'BLOCKED', cls: 'bad' },
  { text: 'Agent "Helper" asked to call a new contract', result: 'REQUIRES_APPROVAL', cls: 'mid' },
  { text: 'Agent "Trader-1" sent 2 NEAR to a known account', result: 'APPROVED', cls: 'ok' },
]

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">
        Every number on this page is DEMO DATA. No wallet is connected
        and nothing here is read from the blockchain yet.
      </p>
      <div className="grid">
        {stats.map((s) => (
          <div className="card" key={s.label}>
            <div className="muted">{s.label}</div>
            <div className="big">{s.value}</div>
          </div>
        ))}
      </div>
      <h2>Recent security events</h2>
      <div className="card">
        <span className="tag-demo">DEMO DATA</span>
        {events.map((e) => (
          <div className="row" key={e.text}>
            <span>{e.text}</span>
            <strong className={e.cls}>{e.result}</strong>
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
