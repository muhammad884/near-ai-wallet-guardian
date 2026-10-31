import { lazy, Suspense, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { Menu, ShieldCheck, X } from 'lucide-react'
import { nav } from './nav'
import { Dashboard, Placeholder } from './pages'
import { Limits } from './limits'
import { Scanner } from './scanner/page'
import { Agents } from './agents/page'
import { Boundary } from './boundary'

const WalletPage = lazy(() => import('./wallet/page'))

export default function App() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <header className="topbar">
        <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <ShieldCheck size={20} color="#35d49a" />
        <strong>AI Wallet Guardian</strong>
        <span className="badge">NEAR</span>
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
          <Route path="/wallet" element={<Boundary><Suspense fallback={<p className="muted">Loading...</p>}><WalletPage /></Suspense></Boundary>} />
          {nav.filter((i) => i.path !== '/' && i.path !== '/limits' && i.path !== '/scanner' && i.path !== '/agents' && i.path !== '/wallet').map((i) => (
            <Route key={i.path} path={i.path} element={<Placeholder item={i} />} />
          ))}
        </Routes>
      </main>
    </div>
  )
}
