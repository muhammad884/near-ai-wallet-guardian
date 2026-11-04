import { useSyncExternalStore } from 'react'
import { loadJson, removeKey, saveJson } from '../storage.ts'

export type LogEvent = {
  id: number
  time: string
  source: string
  summary: string
  outcome: string
  tone: 'ok' | 'mid' | 'bad' | 'neutral'
}

const KEY = 'events'
export const MAX_EVENTS = 200
const TONES = ['ok', 'mid', 'bad', 'neutral']

export function parseEvents(raw: unknown): LogEvent[] {
  if (!Array.isArray(raw)) return []
  const out: LogEvent[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const e = item as Record<string, unknown>
    if (
      typeof e.id !== 'number' ||
      !Number.isFinite(e.id) ||
      typeof e.time !== 'string' ||
      typeof e.source !== 'string' ||
      typeof e.summary !== 'string' ||
      typeof e.outcome !== 'string' ||
      typeof e.tone !== 'string' ||
      !TONES.includes(e.tone)
    ) {
      continue
    }
    out.push({
      id: e.id,
      time: e.time.slice(0, 40),
      source: e.source.slice(0, 60),
      summary: e.summary.slice(0, 300),
      outcome: e.outcome.slice(0, 80),
      tone: e.tone as LogEvent['tone'],
    })
  }
  return out.slice(0, MAX_EVENTS)
}

let events: LogEvent[] = parseEvents(loadJson(KEY))
let nextId = events.reduce((m, e) => Math.max(m, e.id), 0) + 1
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

export function addEvent(e: Omit<LogEvent, 'id' | 'time'>) {
  const entry: LogEvent = { ...e, id: nextId++, time: new Date().toISOString() }
  events = [entry, ...events].slice(0, MAX_EVENTS)
  saveJson(KEY, events)
  notify()
}

export function clearEvents() {
  events = []
  removeKey(KEY)
  notify()
}

export function getEvents(): LogEvent[] {
  return events
}

export function reloadEvents() {
  events = parseEvents(loadJson(KEY))
  nextId = events.reduce((m, x) => Math.max(m, x.id), 0) + 1
  notify()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useEvents() {
  return useSyncExternalStore(subscribe, () => events)
}
