import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { Menu, ShieldCheck, X } from 'lucide-react'
import { nav } from './nav'
import { Dashboard, Placeholder } from './pages'

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
          {nav.filter((i) => i.path !== '/').map((i) => (
            <Route key={i.path} path={i.path} element={<Placeholder item={i} />} />
          ))}
        </Routes>
      </main>
    </div>
  )
}
