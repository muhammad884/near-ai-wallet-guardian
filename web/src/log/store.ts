import { useSyncExternalStore } from 'react'

export type LogEvent = {
  id: number
  time: string
  source: string
  summary: string
  outcome: string
  tone: 'ok' | 'mid' | 'bad'
}

let events: LogEvent[] = []
let nextId = 1
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

export function addEvent(e: Omit<LogEvent, 'id' | 'time'>) {
  const entry: LogEvent = { ...e, id: nextId++, time: new Date().toISOString() }
  events = [entry, ...events].slice(0, 200)
  notify()
}

export function clearEvents() {
  events = []
  notify()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

function getSnapshot() {
  return events
}

export function useEvents() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
