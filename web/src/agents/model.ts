import type { Policy } from '../policy/types'

export type Agent = {
  id: string
  name: string
  enabled: boolean
  maxPerTx: number
  maxDaily: number
  approvalAbove: number
  allowedContracts: string[]
  allowedMethods: string[]
}

export type AgentInput = {
  name: string
  maxPerTx: string
  maxDaily: string
  approvalAbove: string
  contracts: string
  methods: string
}

export type MakeResult =
  | { ok: true; agent: Agent }
  | { ok: false; error: string }

const ACCOUNT_ID = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/

export function splitList(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export function makeAgent(input: AgentInput): MakeResult {
  const name = input.name.trim()
  if (name.length === 0 || name.length > 40) {
    return { ok: false, error: 'Name must be 1 to 40 characters.' }
  }

  const maxPerTx = Number(input.maxPerTx)
  const maxDaily = Number(input.maxDaily)
  const approvalAbove = Number(input.approvalAbove)
  for (const n of [maxPerTx, maxDaily, approvalAbove]) {
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, error: 'Limits must be numbers of 0 or more.' }
    }
  }
  if (maxPerTx > maxDaily) {
    return { ok: false, error: 'The per-transaction limit cannot be above the daily limit.' }
  }

  const allowedContracts = splitList(input.contracts)
  for (const c of allowedContracts) {
    if (c.length < 2 || c.length > 64 || !ACCOUNT_ID.test(c)) {
      return { ok: false, error: `"${c}" is not a valid NEAR account ID.` }
    }
  }

  return {
    ok: true,
    agent: {
      id: crypto.randomUUID(),
      name,
      enabled: true,
      maxPerTx,
      maxDaily,
      approvalAbove,
      allowedContracts,
      allowedMethods: splitList(input.methods),
    },
  }
}

export function toPolicy(agent: Agent): Policy {
  return {
    maxPerTx: agent.maxPerTx,
    maxDaily: agent.maxDaily,
    maxPerAgentDaily: agent.maxDaily,
    approvalAbove: agent.approvalAbove,
    allowedContracts: agent.allowedContracts,
    allowedMethods: agent.allowedMethods,
    restrictedMethods: ['add_key', 'add_full_access_key', 'delete_key', 'delete_account'],
  }
}
