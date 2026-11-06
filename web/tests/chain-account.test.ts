import test from 'node:test'
import assert from 'node:assert/strict'
import { lookupAccount, parseViewAccount, yoctoToNearText } from '../src/chain/account.ts'

const resp = (body: unknown, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => body,
})
const found = {
  jsonrpc: '2.0',
  result: {
    amount: '1500000000000000000000000',
    code_hash: '11111111111111111111111111111111',
    storage_usage: 182,
    block_height: 42,
  },
}
const unknown = { error: { cause: { name: 'UNKNOWN_ACCOUNT' } } }

test('yoctoToNearText is exact', () => {
  assert.equal(yoctoToNearText('1000000000000000000000000'), '1')
  assert.equal(yoctoToNearText('1500000000000000000000000'), '1.5')
  assert.equal(yoctoToNearText('0'), '0')
  assert.equal(yoctoToNearText('1'), '0.000000000000000000000001')
  assert.equal(yoctoToNearText('1.5'), null)
  assert.equal(yoctoToNearText(''), null)
})

test('parseViewAccount reads a found account and a missing one', () => {
  const f = parseViewAccount(found, 'a.testnet')
  assert.ok(f && f.state === 'FOUND')
  if (f.state === 'FOUND') {
    assert.equal(f.balanceNear, '1.5')
    assert.equal(f.hasContract, false)
    assert.equal(f.storageBytes, 182)
  }
  assert.equal(parseViewAccount(unknown, 'x.testnet')?.state, 'NOT_FOUND')
  assert.equal(
    parseViewAccount({ error: { data: 'account x.testnet does not exist while viewing' } }, 'x.testnet')?.state,
    'NOT_FOUND',
  )
})

test('a contract account is reported as having a contract', () => {
  const r = parseViewAccount(
    { result: { ...found.result, code_hash: 'Abc123RealHash' } },
    'c.testnet',
  )
  assert.ok(r && r.state === 'FOUND' && r.hasContract === true)
})

test('malformed answers are not trusted', () => {
  assert.equal(parseViewAccount(null, 'a.testnet'), null)
  assert.equal(parseViewAccount({ result: { amount: 5 } }, 'a.testnet'), null)
  assert.equal(parseViewAccount({ result: { amount: 'x1', code_hash: 'h' } }, 'a.testnet'), null)
  assert.equal(parseViewAccount({ error: { name: 'OTHER' } }, 'a.testnet'), null)
})

test('invalid names never reach the network', async () => {
  let calls = 0
  const fetchImpl = async () => { calls++; return resp(found) }
  for (const bad of ['', 'a', 'UPPER.testnet', 'has space', 'a..b', '-x.testnet']) {
    const r = await lookupAccount(bad, { fetchImpl })
    assert.equal(r.state, 'INVALID')
  }
  assert.equal(calls, 0)
})

test('a busy RPC (5xx) is retried once', async () => {
  let n = 0
  const r = await lookupAccount('a.testnet', {
    fetchImpl: async () => (++n === 1 ? resp({}, 503) : resp(found)),
  })
  assert.equal(r.state, 'FOUND')
  assert.equal(n, 2)
})

test('a missing account is final and not retried', async () => {
  let n = 0
  const r = await lookupAccount('nobody.testnet', {
    fetchImpl: async () => { n++; return resp(unknown) },
  })
  assert.equal(r.state, 'NOT_FOUND')
  assert.equal(n, 1)
})

test('an unreachable RPC says UNAVAILABLE, never NOT_FOUND', async () => {
  let n = 0
  const r = await lookupAccount('a.testnet', {
    fetchImpl: async () => { n++; throw new Error('network') },
  })
  assert.equal(r.state, 'UNAVAILABLE')
  assert.equal(n, 2)
})
