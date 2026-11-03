import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkSend, nearToYocto, yoctoToNear } from '../src/send/logic.ts'

const ONE = BigInt('1000000000000000000000000')

test('one NEAR is 10^24 yocto', () => {
  assert.equal(nearToYocto('1'), ONE)
})

test('fractions are exact', () => {
  assert.equal(nearToYocto('0.5'), BigInt('500000000000000000000000'))
  assert.equal(nearToYocto('1.25'), BigInt('1250000000000000000000000'))
  assert.equal(nearToYocto(' 2 '), ONE * BigInt(2))
})

test('the smallest unit works and 25 decimals are rejected', () => {
  assert.equal(nearToYocto('0.000000000000000000000001'), BigInt(1))
  assert.equal(nearToYocto('0.0000000000000000000000001'), null)
})

test('bad amounts are rejected', () => {
  for (const bad of ['', 'abc', '-1', '1e5', '.5', '1.', '1,5', '0x10']) {
    assert.equal(nearToYocto(bad), null, bad)
  }
})

test('yoctoToNear is exact and trims zeros', () => {
  assert.equal(yoctoToNear(ONE), '1')
  assert.equal(yoctoToNear(BigInt('500000000000000000000000')), '0.5')
  assert.equal(yoctoToNear(BigInt(0)), '0')
  assert.equal(yoctoToNear(BigInt(1)), '0.000000000000000000000001')
  assert.equal(yoctoToNear(nearToYocto('123.456') as bigint), '123.456')
})

test('checkSend rejects bad recipients', () => {
  assert.equal(checkSend('me.testnet', 'Bad Name!', '1', null).ok, false)
  assert.equal(checkSend('me.testnet', 'a', '1', null).ok, false)
  assert.equal(checkSend('me.testnet', 'wrap.near', '1', null).ok, false)
  assert.equal(checkSend('me.testnet', 'me.testnet', '1', null).ok, false)
})

test('checkSend rejects zero and too-large amounts', () => {
  assert.equal(checkSend('me.testnet', 'you.testnet', '0', null).ok, false)
  assert.equal(checkSend('me.testnet', 'you.testnet', 'x', null).ok, false)
  assert.equal(checkSend('me.testnet', 'you.testnet', '5', ONE).ok, false)
})

test('checkSend accepts a good transfer and returns exact yocto', () => {
  const r = checkSend('me.testnet', 'you.testnet', '0.5', ONE)
  assert.equal(r.ok, true)
  if (r.ok) assert.equal(r.yocto, BigInt('500000000000000000000000'))
  assert.equal(checkSend('me.testnet', 'you.testnet', '1', null).ok, true)
})
