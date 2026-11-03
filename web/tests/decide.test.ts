import { test } from 'node:test'
import assert from 'node:assert/strict'
import { currentUsage, decide, mayRequestSignature } from '../src/policy/decide.ts'
import { defaultPolicy, setActivePolicy } from '../src/policy/active.ts'
import { buildPolicy, policyToInput } from '../src/policy/config.ts'
import { evaluate } from '../src/policy/engine.ts'
import { scan } from '../src/scanner/risk.ts'
import { addSent } from '../src/send/session.ts'
import type { Policy } from '../src/policy/types.ts'

const tx = (amount: number, method?: string, receiver = 'wrap.near') => ({
  agentId: 'a1',
  receiver,
  amount,
  method,
})

test('one policy gives one decision everywhere', () => {
  setActivePolicy(defaultPolicy)
  const usage = { totalToday: 0, agentToday: 0 }
  for (const amount of [1, 2, 7, 9, 40]) {
    const t = tx(amount)
    const d = decide(t)
    const e = evaluate(defaultPolicy, true, t, usage)
    const s = scan(defaultPolicy, true, t, usage)
    assert.equal(d.verdict, e.decision)
    assert.deepEqual(d.reasons, e.reasons)
    assert.equal(d.score, s.score)
    assert.equal(d.level, s.level)
    assert.deepEqual(decide(t), d)
  }
})

test('the decision has the structured fields', () => {
  const d = decide(tx(7))
  assert.equal(d.verdict, 'REQUIRES_APPROVAL')
  assert.equal(d.rejected, false)
  assert.equal(d.score, 20)
  assert.equal(d.level, 'LOW')
  assert.ok(d.reasons.length > 0)
  assert.ok(d.rules.length >= 7)
  assert.ok(d.rules.some((r) => r.includes('10 NEAR per transaction')))
})

test('a rejected transaction never reaches the wallet', () => {
  const bad = [tx(40), tx(1, 'add_full_access_key'), tx(Number.NaN), tx(-1)]
  for (const t of bad) {
    const d = decide(t)
    assert.equal(d.rejected, true)
    assert.equal(d.verdict, 'BLOCKED')
    assert.equal(mayRequestSignature(d.verdict, false), false)
    assert.equal(mayRequestSignature(d.verdict, true), false)
  }
})

test('an approval-needed transfer needs the owner to confirm', () => {
  const d = decide(tx(7))
  assert.equal(mayRequestSignature(d.verdict, false), false)
  assert.equal(mayRequestSignature(d.verdict, true), true)
})

test('an approved transfer may go to the wallet', () => {
  const d = decide(tx(2))
  assert.equal(d.verdict, 'APPROVED')
  assert.equal(mayRequestSignature(d.verdict, false), true)
})

test('applying a policy changes what every check decides', () => {
  const p: Policy = { ...defaultPolicy, maxPerTx: 3, approvalAbove: 1 }
  setActivePolicy(p)
  assert.equal(decide(tx(2)).verdict, 'REQUIRES_APPROVAL')
  assert.equal(decide(tx(5)).verdict, 'BLOCKED')
  setActivePolicy(defaultPolicy)
  assert.equal(decide(tx(2)).verdict, 'APPROVED')
  assert.equal(decide(tx(6)).verdict, 'REQUIRES_APPROVAL')
})

test('demo spending is not counted as real spending', () => {
  assert.deepEqual(currentUsage(), { totalToday: 0, agentToday: 0 })
})

test('a policy survives the form round trip', () => {
  const r = buildPolicy(policyToInput(defaultPolicy))
  assert.equal(r.ok, true)
  if (r.ok) {
    assert.equal(r.policy.maxPerTx, defaultPolicy.maxPerTx)
    assert.equal(r.policy.maxDaily, defaultPolicy.maxDaily)
    assert.equal(r.policy.maxPerAgentDaily, defaultPolicy.maxPerAgentDaily)
    assert.equal(r.policy.approvalAbove, defaultPolicy.approvalAbove)
    assert.deepEqual(r.policy.allowedContracts, defaultPolicy.allowedContracts)
    assert.deepEqual(
      [...r.policy.restrictedMethods].sort(),
      [...defaultPolicy.restrictedMethods].sort(),
    )
  }
})

test('real spending in this session counts against the daily limit', () => {
  const p: Policy = {
    ...defaultPolicy,
    maxPerTx: 10,
    maxDaily: 10,
    maxPerAgentDaily: 10,
    approvalAbove: 10,
  }
  setActivePolicy(p)
  addSent(8)
  assert.deepEqual(currentUsage(), { totalToday: 8, agentToday: 8 })
  assert.equal(decide(tx(3)).verdict, 'BLOCKED')
  assert.equal(decide(tx(2)).verdict, 'APPROVED')
  setActivePolicy(defaultPolicy)
})
