import { useSyncExternalStore } from 'react'
import type { Agent } from './model'

let agents: Agent[] = []
const listeners = new Set<() => void>()

export function setAgents(next: Agent[]) {
  agents = next
  listeners.forEach((l) => l())
}

export function useAgents(): Agent[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    () => agents,
  )
}
