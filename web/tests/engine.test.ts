import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluate } from '../src/policy/engine.ts'
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
const tx = (amount: number, method?: string, receiver = 'wrap.near') => ({
  agentId: 'a1',
  receiver,
  amount,
  method,
})

test('small transfer is approved', () => {
  assert.equal(evaluate(policy, true, tx(2), none).decision, 'APPROVED')
})

test('amount above approval threshold needs approval', () => {
  assert.equal(evaluate(policy, true, tx(7), none).decision, 'REQUIRES_APPROVAL')
})

test('amount above per-transaction limit is blocked', () => {
  assert.equal(evaluate(policy, true, tx(40), none).decision, 'BLOCKED')
})

test('disabled agent is blocked', () => {
  assert.equal(evaluate(policy, false, tx(1), none).decision, 'BLOCKED')
})

test('restricted method is blocked even for a tiny amount', () => {
  const r = evaluate(policy, true, tx(0, 'add_full_access_key'), none)
  assert.equal(r.decision, 'BLOCKED')
})

test('daily limit is enforced', () => {
  const r = evaluate(policy, true, tx(4), { totalToday: 48, agentToday: 0 })
  assert.equal(r.decision, 'BLOCKED')
})

test('per-agent daily limit is enforced', () => {
  const r = evaluate(policy, true, tx(4), { totalToday: 0, agentToday: 18 })
  assert.equal(r.decision, 'BLOCKED')
})

test('invalid amounts are blocked', () => {
  assert.equal(evaluate(policy, true, tx(NaN), none).decision, 'BLOCKED')
  assert.equal(evaluate(policy, true, tx(-1), none).decision, 'BLOCKED')
})

test('unknown contract is blocked', () => {
  const r = evaluate(policy, true, tx(1, 'ft_transfer', 'evil.near'), none)
  assert.equal(r.decision, 'BLOCKED')
})

test('unknown method on an allowed contract is blocked', () => {
  assert.equal(evaluate(policy, true, tx(1, 'drain'), none).decision, 'BLOCKED')
})

test('allowed contract and method is approved', () => {
  assert.equal(evaluate(policy, true, tx(1, 'ft_transfer'), none).decision, 'APPROVED')
})

test('block wins over approval, and every decision has a reason', () => {
  const r = evaluate(policy, true, tx(40), none)
  assert.equal(r.decision, 'BLOCKED')
  assert.ok(r.reasons.length > 0)
})
