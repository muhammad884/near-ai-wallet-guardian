import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readResult } from '../src/send/result.ts'

test('a successful outcome gives SUCCESS and the hash', () => {
  const r = readResult([
    {
      status: { SuccessValue: '' },
      transaction: { hash: 'ABC' },
      transaction_outcome: { id: 'XYZ' },
    },
  ])
  assert.equal(r.state, 'SUCCESS')
  assert.equal(r.hash, 'ABC')
})

test('a failure is reported as FAILED', () => {
  const r = readResult({
    status: { Failure: { error: 'x' } },
    transaction_outcome: { id: 'XYZ' },
  })
  assert.equal(r.state, 'FAILED')
  assert.equal(r.hash, 'XYZ')
})

test('an unreadable result is UNKNOWN, never success', () => {
  for (const v of [undefined, null, [], 'ok', 42, {}, [{}], { status: 'Unknown' }]) {
    assert.equal(readResult(v).state, 'UNKNOWN')
  }
})

test('a hash alone does not mean success', () => {
  const r = readResult({ transaction: { hash: 'H' } })
  assert.equal(r.state, 'UNKNOWN')
  assert.equal(r.hash, 'H')
})
