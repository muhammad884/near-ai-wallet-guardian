import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, ShieldCheck, Bot, KeyRound, Gauge,
  Search, Bell, History, Settings,
} from 'lucide-react'

export type NavItem = {
  path: string
  label: string
  icon: LucideIcon
  desc: string
  stage: string
}

export const nav: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview of your security.', stage: 'Stage 2' },
  { path: '/wallet', label: 'Wallet Security', icon: ShieldCheck, desc: 'Connect a NEAR wallet and review its keys.', stage: 'Stage 3' },
  { path: '/agents', label: 'AI Agents', icon: Bot, desc: 'Register and manage your AI agents.', stage: 'Stage 4' },
  { path: '/permissions', label: 'Permissions', icon: KeyRound, desc: 'Choose what each agent may do.', stage: 'Stage 4' },
  { path: '/limits', label: 'Spending Limits', icon: Gauge, desc: 'Per-transaction and daily limits and the policy engine.', stage: 'Stage 5' },
  { path: '/scanner', label: 'Transaction Scanner', icon: Search, desc: 'Score a transaction with transparent rules.', stage: 'Stage 6' },
  { path: '/scam', label: 'Scam Detector', icon: ShieldCheck, desc: 'Explain why an address may be risky.', stage: 'Stage 7' },
  { path: '/alerts', label: 'Security Alerts', icon: Bell, desc: 'Alerts raised by the policy engine.', stage: 'Stage 5' },
  { path: '/history', label: 'Activity History', icon: History, desc: 'Auditable log of decisions.', stage: 'Stage 5' },
  { path: '/settings', label: 'Settings', icon: Settings, desc: 'Network and theme settings.', stage: 'Stage 3' },
]
