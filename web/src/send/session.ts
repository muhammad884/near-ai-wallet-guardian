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

export function getSentTotal(): number {
  return parseSent(loadJson(KEY), today())
}

export function addSent(n: number): void {
  if (!Number.isFinite(n) || n <= 0) return
  saveJson(KEY, { day: today(), total: getSentTotal() + n })
}
