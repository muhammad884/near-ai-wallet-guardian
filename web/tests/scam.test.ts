import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyze } from '../src/scam/rules.ts'

test('a plain well-formed name has no signs', () => {
  const r = analyze('wrap.near')
  assert.equal(r.level, 'NO SIGNS FOUND')
  assert.equal(r.score, 0)
  assert.equal(r.signals.length, 0)
})

test('a one-letter typo of a known name is HIGH', () => {
  const r = analyze('wrap.neer')
  assert.equal(r.level, 'HIGH')
  assert.equal(r.score, 50)
  assert.equal(r.signals.length, 1)
})

test('input is trimmed and lower-cased', () => {
  const r = analyze('  WRAP.NEER ')
  assert.equal(r.account, 'wrap.neer')
  assert.equal(r.level, 'HIGH')
})

test('a bait word gives MEDIUM', () => {
  const r = analyze('free-airdrop.near')
  assert.equal(r.level, 'MEDIUM')
  assert.equal(r.score, 20)
})

test('two bait words add up', () => {
  const r = analyze('claim-reward.testnet')
  assert.equal(r.score, 40)
  assert.equal(r.signals.length, 2)
})

test('an invalid account ID is rejected', () => {
  const r = analyze('Bad Name!')
  assert.equal(r.level, 'INVALID')
  assert.equal(r.score, 0)
})

test('a 64-character hex account is accepted with no signs', () => {
  const r = analyze('a'.repeat(64))
  assert.equal(r.level, 'NO SIGNS FOUND')
})

test('many digits add 10 points and give LOW', () => {
  const r = analyze('user12345678.near')
  assert.equal(r.score, 10)
  assert.equal(r.level, 'LOW')
})

test('near in the name without a .near ending adds 10 points', () => {
  const r = analyze('mynearwallet')
  assert.equal(r.score, 10)
  assert.equal(r.level, 'LOW')
})

test('the report always lists what was not checked', () => {
  const r = analyze('some.near')
  assert.equal(r.notChecked.length, 5)
  assert.ok(r.confidence.startsWith('Low'))
})

test('a short known name is not flagged for a two-edit difference', () => {
  const r = analyze('aurxrb')
  assert.equal(r.level, 'NO SIGNS FOUND')
})
