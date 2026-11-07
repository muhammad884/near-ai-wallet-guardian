import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPolicy } from '../src/policy/config.ts'
import type { PolicyInput } from '../src/policy/config.ts'

const good: PolicyInput = {
  maxPerTx: '10',
  maxDaily: '50',
  maxPerAgentDaily: '20',
  approvalAbove: '5',
  contracts: 'wrap.near',
  methods: 'ft_transfer',
  restricted: 'delete_account',
}

test('a valid policy is built', () => {
  const r = buildPolicy(good)
  assert.equal(r.ok, true)
  if (r.ok) {
    assert.equal(r.policy.maxPerTx, 10)
    assert.equal(r.policy.maxDaily, 50)
    assert.deepEqual(r.policy.allowedContracts, ['wrap.near'])
  }
})

test('an empty number field is rejected, not read as zero', () => {
  assert.equal(buildPolicy({ ...good, maxPerTx: '' }).ok, false)
  assert.equal(buildPolicy({ ...good, maxDaily: '   ' }).ok, false)
})

test('negative and non-numeric numbers are rejected', () => {
  assert.equal(buildPolicy({ ...good, maxPerTx: '-1' }).ok, false)
  assert.equal(buildPolicy({ ...good, approvalAbove: 'abc' }).ok, false)
  assert.equal(buildPolicy({ ...good, maxDaily: 'Infinity' }).ok, false)
})

test('per-transaction limit above the daily limit is rejected', () => {
  assert.equal(buildPolicy({ ...good, maxPerTx: '60' }).ok, false)
})

test('per-agent limit above the daily limit is rejected', () => {
  assert.equal(buildPolicy({ ...good, maxPerAgentDaily: '60' }).ok, false)
})

test('approval threshold above the per-transaction limit is rejected', () => {
  assert.equal(buildPolicy({ ...good, approvalAbove: '11' }).ok, false)
})

test('an invalid contract ID is rejected', () => {
  assert.equal(buildPolicy({ ...good, contracts: 'wrap.near, Bad Name!' }).ok, false)
})

test('key-management methods are always restricted, without duplicates', () => {
  const r = buildPolicy({ ...good, restricted: 'delete_account, add_key, add_key' })
  assert.equal(r.ok, true)
  if (r.ok) {
    const list = r.policy.restrictedMethods
    for (const m of ['add_key', 'add_full_access_key', 'delete_key', 'delete_account']) {
      assert.ok(list.includes(m))
    }
    assert.equal(new Set(list).size, list.length)
  }
})

test('policy preserves exact 24-decimal limits', () => {
  const result = buildPolicy({
    maxPerTx: '0.000000000000000000000003',
    maxDaily: '0.000000000000000000000009',
    maxPerAgentDaily: '0.000000000000000000000006',
    approvalAbove: '0.000000000000000000000002',
    contracts: '',
    methods: '',
    restricted: '',
  })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.policy.maxPerTxExact, '0.000000000000000000000003')
    assert.equal(result.policy.maxDailyExact, '0.000000000000000000000009')
  }
})

test('policy rejects a 25-decimal limit', () => {
  const result = buildPolicy({
    maxPerTx: '0.0000000000000000000000001',
    maxDaily: '1',
    maxPerAgentDaily: '1',
    approvalAbove: '0',
    contracts: '',
    methods: '',
    restricted: '',
  })
  assert.equal(result.ok, false)
})

test('policy compares exact limits without floating-point rounding', () => {
  const result = buildPolicy({
    maxPerTx: '1.000000000000000000000001',
    maxDaily: '1.000000000000000000000000',
    maxPerAgentDaily: '1',
    approvalAbove: '0',
    contracts: '',
    methods: '',
    restricted: '',
  })
  assert.equal(result.ok, false)
})
