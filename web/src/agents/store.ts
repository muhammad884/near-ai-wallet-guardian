import { useSyncExternalStore } from 'react'
import type { Agent } from './model'
import { loadJson, saveJson } from '../storage.ts'

const KEY = 'agents'
const MAX_AGENTS = 100

function strings(v: unknown): string[] | null {
  return Array.isArray(v) && v.every((s) => typeof s === 'string')
    ? (v as string[])
    : null
}

export function parseAgents(raw: unknown): Agent[] {
  if (!Array.isArray(raw)) return []
  const out: Agent[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const a = item as Record<string, unknown>
    const contracts = strings(a.allowedContracts)
    const methods = strings(a.allowedMethods)
    if (
      typeof a.id !== 'string' ||
      a.id === '' ||
      typeof a.name !== 'string' ||
      a.name.trim() === '' ||
      a.name.length > 40 ||
      typeof a.enabled !== 'boolean' ||
      !contracts ||
      !methods
    ) {
      continue
    }
    const nums = [a.maxPerTx, a.maxDaily, a.approvalAbove]
    if (!nums.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0)) {
      continue
    }
    out.push({
      id: a.id,
      name: a.name,
      enabled: a.enabled,
      maxPerTx: a.maxPerTx as number,
      maxDaily: a.maxDaily as number,
      approvalAbove: a.approvalAbove as number,
      allowedContracts: contracts,
      allowedMethods: methods,
    })
  }
  return out.slice(0, MAX_AGENTS)
}

let agents: Agent[] = parseAgents(loadJson(KEY))
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

export function setAgents(next: Agent[]) {
  agents = next
  saveJson(KEY, next)
  notify()
}

export function getAgents(): Agent[] {
  return agents
}

export function reloadAgents() {
  agents = parseAgents(loadJson(KEY))
  notify()
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
