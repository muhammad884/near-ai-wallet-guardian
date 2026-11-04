import type { Policy } from './types'
import { buildPolicy } from './config.ts'
import { loadJson, saveJson } from '../storage.ts'

export const defaultPolicy: Policy = {
  maxPerTx: 10,
  maxDaily: 50,
  maxPerAgentDaily: 20,
  approvalAbove: 5,
  allowedContracts: ['wrap.near'],
  allowedMethods: ['ft_transfer'],
  restrictedMethods: ['add_key', 'add_full_access_key', 'delete_key', 'delete_account'],
}

const KEY = 'policy'

function strings(v: unknown): string[] | null {
  return Array.isArray(v) && v.every((s) => typeof s === 'string')
    ? (v as string[])
    : null
}

export function parsePolicy(raw: unknown): Policy | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>
  const contracts = strings(o.allowedContracts)
  const methods = strings(o.allowedMethods)
  const restricted = strings(o.restrictedMethods)
  if (!contracts || !methods || !restricted) return null
  for (const n of [o.maxPerTx, o.maxDaily, o.maxPerAgentDaily, o.approvalAbove]) {
    if (typeof n !== 'number') return null
  }
  const r = buildPolicy({
    maxPerTx: String(o.maxPerTx),
    maxDaily: String(o.maxDaily),
    maxPerAgentDaily: String(o.maxPerAgentDaily),
    approvalAbove: String(o.approvalAbove),
    contracts: contracts.join(', '),
    methods: methods.join(', '),
    restricted: restricted.join(', '),
  })
  return r.ok ? r.policy : null
}

let active: Policy = parsePolicy(loadJson(KEY)) ?? defaultPolicy

export function setActivePolicy(p: Policy): void {
  active = p
  saveJson(KEY, p)
}

export function getActivePolicy(): Policy {
  return active
}

export function reloadPolicy(): void {
  active = parsePolicy(loadJson(KEY)) ?? defaultPolicy
}
