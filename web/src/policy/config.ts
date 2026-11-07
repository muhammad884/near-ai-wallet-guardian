import type { Policy } from './types'
import { splitList } from '../agents/model.ts'
import { decimalToYocto, yoctoToDecimal } from './amount.ts'

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

export function buildPolicy(input: PolicyInput): BuildResult {
  const values = [
    input.maxPerTx,
    input.maxDaily,
    input.maxPerAgentDaily,
    input.approvalAbove,
  ]

  const exact = values.map(decimalToYocto)

  if (exact.some((value) => value === null)) {
    return {
      ok: false,
      error: 'Every limit must be a valid NEAR amount with up to 24 decimals.',
    }
  }

  const [maxTx, daily, agentDaily, approval] = exact as bigint[]

  if (values.some((value) => !Number.isFinite(Number(value)))) {
    return { ok: false, error: 'Every limit must be a finite number.' }
  }

  if (maxTx > daily) {
    return { ok: false, error: 'The per-transaction limit cannot be above the daily limit.' }
  }

  if (agentDaily > daily) {
    return { ok: false, error: 'The per-agent daily limit cannot be above the daily limit.' }
  }

  if (approval > maxTx) {
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
      maxPerTx: Number(input.maxPerTx),
      maxDaily: Number(input.maxDaily),
      maxPerAgentDaily: Number(input.maxPerAgentDaily),
      approvalAbove: Number(input.approvalAbove),
      maxPerTxExact: yoctoToDecimal(maxTx),
      maxDailyExact: yoctoToDecimal(daily),
      maxPerAgentDailyExact: yoctoToDecimal(agentDaily),
      approvalAboveExact: yoctoToDecimal(approval),
      allowedContracts,
      allowedMethods: splitList(input.methods),
      restrictedMethods,
    },
  }
}

export function policyToInput(p: Policy): PolicyInput {
  return {
    maxPerTx: p.maxPerTxExact ?? String(p.maxPerTx),
    maxDaily: p.maxDailyExact ?? String(p.maxDaily),
    maxPerAgentDaily: p.maxPerAgentDailyExact ?? String(p.maxPerAgentDaily),
    approvalAbove: p.approvalAboveExact ?? String(p.approvalAbove),
    contracts: p.allowedContracts.join(', '),
    methods: p.allowedMethods.join(', '),
    restricted: p.restrictedMethods.join(', '),
  }
}
