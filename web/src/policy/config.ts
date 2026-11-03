import type { Policy } from './types'
import { splitList } from '../agents/model.ts'

export type PolicyInput = {
  maxPerTx: string
  maxDaily: string
  maxPerAgentDaily: string
  approvalAbove: string
  contracts: string
  methods: string
  restricted: string
}

export type BuildResult =
  | { ok: true; policy: Policy }
  | { ok: false; error: string }

const ACCOUNT_ID = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/

const ALWAYS_RESTRICTED = [
  'add_key',
  'add_full_access_key',
  'delete_key',
  'delete_account',
]

function num(text: string): number {
  return text.trim() === '' ? Number.NaN : Number(text)
}

export function buildPolicy(input: PolicyInput): BuildResult {
  const maxPerTx = num(input.maxPerTx)
  const maxDaily = num(input.maxDaily)
  const maxPerAgentDaily = num(input.maxPerAgentDaily)
  const approvalAbove = num(input.approvalAbove)

  for (const n of [maxPerTx, maxDaily, maxPerAgentDaily, approvalAbove]) {
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, error: 'Every limit must be a number of 0 or more.' }
    }
  }
  if (maxPerTx > maxDaily) {
    return { ok: false, error: 'The per-transaction limit cannot be above the daily limit.' }
  }
  if (maxPerAgentDaily > maxDaily) {
    return { ok: false, error: 'The per-agent daily limit cannot be above the daily limit.' }
  }
  if (approvalAbove > maxPerTx) {
    return { ok: false, error: 'The approval threshold cannot be above the per-transaction limit.' }
  }

  const allowedContracts = splitList(input.contracts)
  for (const c of allowedContracts) {
    if (c.length < 2 || c.length > 64 || !ACCOUNT_ID.test(c)) {
      return { ok: false, error: `"${c}" is not a valid NEAR account ID.` }
    }
  }

  const restrictedMethods = Array.from(
    new Set([...splitList(input.restricted), ...ALWAYS_RESTRICTED]),
  )

  return {
    ok: true,
    policy: {
      maxPerTx,
      maxDaily,
      maxPerAgentDaily,
      approvalAbove,
      allowedContracts,
      allowedMethods: splitList(input.methods),
      restrictedMethods,
    },
  }
}

export function policyToInput(p: Policy): PolicyInput {
  return {
    maxPerTx: String(p.maxPerTx),
    maxDaily: String(p.maxDaily),
    maxPerAgentDaily: String(p.maxPerAgentDaily),
    approvalAbove: String(p.approvalAbove),
    contracts: p.allowedContracts.join(', '),
    methods: p.allowedMethods.join(', '),
    restricted: p.restrictedMethods.join(', '),
  }
}
