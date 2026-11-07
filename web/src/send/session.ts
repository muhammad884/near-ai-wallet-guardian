import { loadJson, saveJson } from '../storage.ts'
import { decimalToYocto, yoctoToDecimal } from '../policy/amount.ts'

const KEY = 'sent'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function readExact(value: unknown): bigint {
  if (typeof value !== 'string' && typeof value !== 'number') return 0n
  const result = decimalToYocto(value)
  return result !== null && result >= 0n ? result : 0n
}

export function parseSent(raw: unknown, day: string): number {
  if (typeof raw !== 'object' || raw === null) return 0
  const o = raw as Record<string, unknown>
  if (o.day !== day) return 0
  const exact = readExact(o.totalExact)
  if (typeof o.totalExact === 'string') return Number(yoctoToDecimal(exact))
  const t = o.total
  return typeof t === 'number' && Number.isFinite(t) && t >= 0 ? t : 0
}

export function parseSentExact(raw: unknown, day: string): string {
  if (typeof raw !== 'object' || raw === null) return '0'
  const o = raw as Record<string, unknown>
  if (o.day !== day) return '0'
  if (typeof o.totalExact === 'string') {
    return yoctoToDecimal(readExact(o.totalExact))
  }
  return yoctoToDecimal(readExact(o.total))
}

export function getAgentSentTotal(agentId: string): number {
  const raw = loadJson(KEY) as Record<string, unknown> | null
  if (!raw || raw.day !== today()) return 0

  const exactAgents = raw.agentsExact
  if (typeof exactAgents === 'object' && exactAgents !== null) {
    const value = (exactAgents as Record<string, unknown>)[agentId]
    if (typeof value === 'string') {
      return Number(yoctoToDecimal(readExact(value)))
    }
  }

  if (typeof raw.agents !== 'object' || !raw.agents) return 0
  const value = (raw.agents as Record<string, unknown>)[agentId]
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
}

export function getAgentSentTotalExact(agentId: string): string {
  const raw = loadJson(KEY) as Record<string, unknown> | null
  if (!raw || raw.day !== today()) return '0'

  const exactAgents = raw.agentsExact
  if (typeof exactAgents === 'object' && exactAgents !== null) {
    const value = (exactAgents as Record<string, unknown>)[agentId]
    if (typeof value === 'string') {
      return yoctoToDecimal(readExact(value))
    }
  }

  if (typeof raw.agents !== 'object' || !raw.agents) return '0'
  const value = (raw.agents as Record<string, unknown>)[agentId]
  return yoctoToDecimal(readExact(value))
}

export function getSentTotal(): number {
  return parseSent(loadJson(KEY), today())
}

export function getSentTotalExact(): string {
  return parseSentExact(loadJson(KEY), today())
}

export function addSentExact(value: string | number, agentId = 'you'): void {
  if (!agentId || agentId.length > 128) return

  const amount = decimalToYocto(value)
  if (amount === null || amount <= 0n) return

  const raw = loadJson(KEY) as Record<string, unknown> | null
  const sameDay = raw?.day === today()
  const total = sameDay
    ? readExact(raw?.totalExact ?? raw?.total)
    : 0n

  const agentsExact: Record<string, string> = {}
  const agents: Record<string, number> = {}

  if (sameDay && raw) {
    const savedExact = raw.agentsExact
    const savedAgents = raw.agents

    if (typeof savedExact === 'object' && savedExact !== null) {
      for (const [id, value] of Object.entries(savedExact)) {
        const exact = readExact(value)
        agentsExact[id] = yoctoToDecimal(exact)
      }
    }

    if (typeof savedAgents === 'object' && savedAgents !== null) {
      for (const [id, value] of Object.entries(savedAgents)) {
        if (!(id in agentsExact)) {
          agentsExact[id] = yoctoToDecimal(readExact(value))
        }
      }
    }

    if (Object.keys(agentsExact).length === 0 && total > 0n) {
      agentsExact.you = yoctoToDecimal(total)
    }
  }

  const previousAgent = readExact(agentsExact[agentId] ?? '0')
  const newTotal = total + amount
  const newAgentTotal = previousAgent + amount

  agentsExact[agentId] = yoctoToDecimal(newAgentTotal)

  for (const [id, exact] of Object.entries(agentsExact)) {
    agents[id] = Number(exact)
  }

  saveJson(KEY, {
    day: today(),
    total: Number(yoctoToDecimal(newTotal)),
    totalExact: yoctoToDecimal(newTotal),
    agents,
    agentsExact,
  })
}

export function addSent(n: number, agentId = 'you'): void {
  if (!Number.isFinite(n) || n <= 0) return
  addSentExact(String(n), agentId)
}
