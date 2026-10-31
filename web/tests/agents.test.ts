import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeAgent, splitList, toPolicy } from '../src/agents/model.ts'

const good = {
  name: 'Trader-1',
  maxPerTx: '10',
  maxDaily: '50',
  approvalAbove: '5',
  contracts: 'wrap.near, usdt.tether-token.near',
  methods: 'ft_transfer',
}

test('a valid agent is created', () => {
  const r = makeAgent(good)
  assert.equal(r.ok, true)
  if (r.ok) {
    assert.equal(r.agent.name, 'Trader-1')
    assert.equal(r.agent.enabled, true)
    assert.deepEqual(r.agent.allowedContracts, ['wrap.near', 'usdt.tether-token.near'])
    assert.deepEqual(r.agent.allowedMethods, ['ft_transfer'])
  }
})

test('an empty name is rejected', () => {
  assert.equal(makeAgent({ ...good, name: '   ' }).ok, false)
})

test('a name longer than 40 characters is rejected', () => {
  assert.equal(makeAgent({ ...good, name: 'x'.repeat(41) }).ok, false)
})

test('negative or non-numeric limits are rejected', () => {
  assert.equal(makeAgent({ ...good, maxPerTx: '-1' }).ok, false)
  assert.equal(makeAgent({ ...good, maxDaily: 'abc' }).ok, false)
  assert.equal(makeAgent({ ...good, approvalAbove: 'NaN' }).ok, false)
})

test('per-transaction limit above daily limit is rejected', () => {
  assert.equal(makeAgent({ ...good, maxPerTx: '60', maxDaily: '50' }).ok, false)
})

test('an invalid contract account ID is rejected', () => {
  const r = makeAgent({ ...good, contracts: 'wrap.near, Evil Account!' })
  assert.equal(r.ok, false)
})

test('empty contract list is allowed and gives an empty list', () => {
  const r = makeAgent({ ...good, contracts: '', methods: '' })
  assert.equal(r.ok, true)
  if (r.ok) {
    assert.deepEqual(r.agent.allowedContracts, [])
    assert.deepEqual(r.agent.allowedMethods, [])
  }
})

test('splitList trims spaces and drops empty items', () => {
  assert.deepEqual(splitList(' a , b ,, c '), ['a', 'b', 'c'])
})

test('toPolicy copies limits and restricts key management methods', () => {
  const r = makeAgent(good)
  assert.equal(r.ok, true)
  if (r.ok) {
    const p = toPolicy(r.agent)
    assert.equal(p.maxPerTx, 10)
    assert.equal(p.maxDaily, 50)
    assert.equal(p.maxPerAgentDaily, 50)
    assert.equal(p.approvalAbove, 5)
    assert.ok(p.restrictedMethods.includes('add_full_access_key'))
    assert.ok(p.restrictedMethods.includes('delete_account'))
  }
})

test('each agent gets a different id', () => {
  const a = makeAgent(good)
  const b = makeAgent(good)
  assert.equal(a.ok && b.ok, true)
  if (a.ok && b.ok) assert.notEqual(a.agent.id, b.agent.id)
})
