import { clearEvents, useEvents } from '../log/store'
import { setTheme, useTheme } from '../theme'

export function Settings() {
  const theme = useTheme()
  const events = useEvents()
  return (
    <div>
      <h1>Settings</h1>
      <p className="muted">Only settings that really do something are here.</p>

      <h2>Theme</h2>
      <div className="card">
        <div className="row">
          <span>Current theme</span>
          <strong>{theme === 'dark' ? 'Dark' : 'Light'}</strong>
        </div>
        <button className="btn" onClick={() => setTheme('dark')}>Use dark theme</button>
        <button className="btn" onClick={() => setTheme('light')}>Use light theme</button>
        <p className="muted">Saved in this browser and restored on your next visit.</p>
      </div>

      <h2>Decision history</h2>
      <div className="card">
        <div className="row">
          <span>Decisions kept in memory</span>
          <strong>{events.length}</strong>
        </div>
        <button className="btn" onClick={clearEvents}>Clear decision history</button>
        <p className="muted">The history is lost when you refresh the page.</p>
      </div>

      <h2>About</h2>
      <div className="card">
        <div className="row"><span>Network</span><strong>NEAR testnet only</strong></div>
        <div className="row"><span>Wallet</span><strong>Meteor, via Wallet Selector</strong></div>
        <p className="muted">
          This app never asks for or stores a seed phrase or private key. It
          saves only your theme choice. The wallet library keeps its own
          sign-in state in your browser.
        </p>
      </div>
    </div>
  )
}
