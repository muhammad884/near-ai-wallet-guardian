import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scan } from '../src/scanner/risk.ts'
import type { Policy } from '../src/policy/types.ts'

const policy: Policy = {
  maxPerTx: 10,
  maxDaily: 50,
  maxPerAgentDaily: 20,
  approvalAbove: 5,
  allowedContracts: ['wrap.near'],
  allowedMethods: ['ft_transfer'],
  restrictedMethods: ['add_full_access_key', 'delete_account'],
}
const none = { totalToday: 0, agentToday: 0 }
const tx = (
  amount: number,
  method?: string,
  receiver = 'wrap.near',
  args?: string,
) => ({ agentId: 'a1', receiver, amount, method, args })

test('safe transfer has score 0 and LOW level', () => {
  const r = scan(policy, true, tx(2), none)
  assert.equal(r.score, 0)
  assert.equal(r.level, 'LOW')
  assert.equal(r.findings.length, 0)
})

test('approval-needed transfer adds 20 points', () => {
  const r = scan(policy, true, tx(7), none)
  assert.equal(r.policy.decision, 'REQUIRES_APPROVAL')
  assert.equal(r.score, 20)
})

test('amount close to the limit adds 10 points', () => {
  const r = scan(policy, true, tx(9), none)
  assert.equal(r.score, 30)
  assert.equal(r.level, 'MEDIUM')
})

test('policy-blocked transaction is HIGH risk', () => {
  const r = scan(policy, true, tx(40), none)
  assert.equal(r.policy.decision, 'BLOCKED')
  assert.equal(r.score, 60)
  assert.equal(r.level, 'HIGH')
})

test('adding a full access key is CRITICAL', () => {
  const r = scan(policy, true, tx(1, 'add_full_access_key'), none)
  assert.equal(r.score, 90)
  assert.equal(r.level, 'CRITICAL')
})

test('invalid receiver format is flagged', () => {
  const r = scan(policy, true, tx(1, undefined, 'Evil Account!'), none)
  assert.equal(r.score, 25)
  assert.equal(r.level, 'MEDIUM')
})

test('arguments mentioning full access are flagged', () => {
  const r = scan(
    policy, true,
    tx(1, 'ft_transfer', 'wrap.near', '{"permission":"full_access"}'),
    none,
  )
  assert.equal(r.score, 20)
  assert.equal(r.findings.length, 1)
})

test('score never goes above 100', () => {
  const r = scan(
    policy, true,
    tx(40, 'add_full_access_key', 'Bad Name', 'full_access'),
    none,
  )
  assert.equal(r.score, 100)
  assert.equal(r.level, 'CRITICAL')
})

test('invalid amount is not LOW risk', () => {
  const r = scan(policy, true, tx(NaN), none)
  assert.equal(r.policy.decision, 'BLOCKED')
  assert.equal(r.level, 'HIGH')
})

test('every finding has points and a reason text', () => {
  const r = scan(policy, true, tx(40, 'add_full_access_key'), none)
  assert.ok(r.findings.length > 0)
  for (const f of r.findings) {
    assert.ok(f.points > 0)
    assert.ok(f.text.length > 0)
  }
})
