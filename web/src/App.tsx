import { lazy, Suspense, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { Logo } from './Logo'
import { nav } from './nav'
import { Dashboard } from './pages'
import { Limits } from './limits'
import { Scanner } from './scanner/page'
import { Agents } from './agents/page'
import { Alerts, History } from './log/page'
import { ScamDetector } from './scam/page'
import { Permissions } from './permissions/page'
import { Settings } from './settings/page'
import { Boundary } from './boundary'
import { setTheme, useTheme } from './theme'

const WalletPage = lazy(() => import('./wallet/page'))

export default function App() {
  const [open, setOpen] = useState(false)
  const theme = useTheme()
  return (
    <div>
      <header className="topbar">
        <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <Logo size={22} />
        <strong>Warden</strong>
        <span className="badge">NEAR</span>
        <button
          className="theme-btn"
          aria-label="Switch theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>
      <nav className={open ? 'sidebar open' : 'sidebar'}>
        {nav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) => (isActive ? 'link active' : 'link')}
          >
            <item.icon size={18} /> {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/limits" element={<Limits />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/scam" element={<ScamDetector />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="/wallet"
            element={
              <Boundary>
                <Suspense fallback={<p className="muted">Loading...</p>}>
                  <WalletPage />
                </Suspense>
              </Boundary>
            }
          />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  )
}
