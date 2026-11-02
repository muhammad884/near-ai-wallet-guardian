import { clearEvents, useEvents } from './store'

function List({ onlyRisky }: { onlyRisky: boolean }) {
  const all = useEvents()
  const events = onlyRisky ? all.filter((e) => e.tone === 'mid' || e.tone === 'bad') : all
  return (
    <div>
      {events.length === 0 && (
        <p className="muted">
          Nothing here yet. Run a check on the Spending Limits or
          Transaction Scanner page.
        </p>
      )}
      {events.map((e) => (
        <div className="card" key={e.id} style={{ marginBottom: 12 }}>
          <div className="row">
            <strong className={e.tone}>{e.outcome}</strong>
            <span className="muted">{e.source}</span>
          </div>
          <div className="row"><span>{e.summary}</span></div>
          <div className="muted">{e.time}</div>
        </div>
      ))}
    </div>
  )
}

export function History() {
  const events = useEvents()
  return (
    <div>
      <h1>Activity History</h1>
      <p className="muted">
        Every decision made by the policy engine or the scanner in this
        browser tab. It is kept in memory only, so it is cleared when you
        refresh the page. It is not stored on the blockchain.
      </p>
      {events.length > 0 && (
        <button className="btn" onClick={clearEvents}>Clear history</button>
      )}
      <h2>Decisions</h2>
      <List onlyRisky={false} />
    </div>
  )
}

export function Alerts() {
  return (
    <div>
      <h1>Security Alerts</h1>
      <p className="muted">
        Only the decisions that were blocked, needed approval, or scored as
        risky. Nothing here is read from the blockchain.
      </p>
      <h2>Alerts</h2>
      <List onlyRisky={true} />
    </div>
  )
}
