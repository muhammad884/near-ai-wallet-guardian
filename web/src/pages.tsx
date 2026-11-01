import type { NavItem } from './nav'
import { useEvents } from './log/store'

export function Dashboard() {
  const events = useEvents()
  const bad = events.filter((e) => e.tone === 'bad').length
  const mid = events.filter((e) => e.tone === 'mid').length
  const stats = [
    { label: 'Decisions this session', value: String(events.length) },
    { label: 'Blocked or high risk', value: String(bad) },
    { label: 'Needs attention', value: String(mid) },
    { label: 'Active agents', value: 'Not linked yet' },
  ]
  const recent = events.slice(0, 5)

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">
        These numbers come from the decisions made in this browser tab and
        reset when you refresh the page. No wallet data is read here yet.
      </p>
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
            <span>{e.source}: {e.summary}</span>
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
