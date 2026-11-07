import { loadJson, saveJson } from '../storage.ts'

const KEY = 'sent'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function parseSent(raw: unknown, day: string): number {
  if (typeof raw !== 'object' || raw === null) return 0
  const o = raw as Record<string, unknown>
  if (o.day !== day) return 0
  const t = o.total
  return typeof t === 'number' && Number.isFinite(t) && t >= 0 ? t : 0
}

export function getAgentSentTotal(agentId: string): number {
  const raw = loadJson(KEY) as Record<string, unknown> | null;
  if (!raw || raw.day !== today() || typeof raw.agents !== 'object' || !raw.agents) return 0;
  const value = (raw.agents as Record<string, unknown>)[agentId];
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

export function getSentTotal(): number {
  return parseSent(loadJson(KEY), today())
}

export function addSent(n: number, agentId = 'you'): void {
  if (!Number.isFinite(n) || n <= 0 || !agentId || agentId.length > 128) return

  const raw = loadJson(KEY) as Record<string, unknown> | null
  const sameDay = raw?.day === today()
  const total = getSentTotal()
  const agents: Record<string, number> = {}

  if (sameDay && raw && typeof raw.agents === 'object' && raw.agents !== null) {
    for (const [id, value] of Object.entries(raw.agents)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        agents[id] = value
      }
    }
  } else if (sameDay && total > 0) {
    agents.you = total
  }

  agents[agentId] = (agents[agentId] ?? 0) + n
  saveJson(KEY, { day: today(), total: total + n, agents })
}
