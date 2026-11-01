import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseKeys } from '../src/wallet/keys.ts'

const full = {
  public_key: 'ed25519:AAA',
  access_key: { nonce: 1, permission: 'FullAccess' },
}
const fn = {
  public_key: 'ed25519:BBB',
  access_key: {
    nonce: 2,
    permission: {
      FunctionCall: {
        allowance: '1000',
        receiver_id: 'wrap.near',
        method_names: ['ft_transfer'],
      },
    },
  },
}
const any = {
  public_key: 'ed25519:CCC',
  access_key: {
    nonce: 3,
    permission: {
      FunctionCall: { allowance: null, receiver_id: 'app.near', method_names: [] },
    },
  },
}
const wrap = (keys: unknown[]) => ({
  jsonrpc: '2.0',
  id: 'x',
  result: { keys },
})

test('a full-access key is recognised', () => {
  const r = parseKeys(wrap([full]))
  assert.equal(r?.keys[0]?.kind, 'FULL_ACCESS')
  assert.equal(r?.fullAccess, 1)
})

test('a function-call key keeps its contract and methods', () => {
  const k = parseKeys(wrap([fn]))?.keys[0]
  assert.equal(k?.kind, 'FUNCTION_CALL')
  assert.equal(k?.receiver, 'wrap.near')
  assert.deepEqual(k?.methods, ['ft_transfer'])
})

test('an empty method list is kept empty', () => {
  const k = parseKeys(wrap([any]))?.keys[0]
  assert.equal(k?.kind, 'FUNCTION_CALL')
  assert.deepEqual(k?.methods, [])
})

test('an unknown permission is OTHER, not trusted', () => {
  const r = parseKeys(
    wrap([
      {
        public_key: 'ed25519:DDD',
        access_key: { nonce: 4, permission: { GasKey: {} } },
      },
    ]),
  )
  assert.equal(r?.keys[0]?.kind, 'OTHER')
  assert.equal(r?.other, 1)
})

test('a malformed response gives null', () => {
  assert.equal(parseKeys(null), null)
  assert.equal(parseKeys({}), null)
  assert.equal(parseKeys({ result: {} }), null)
  assert.equal(parseKeys('nope'), null)
})

test('counts add up', () => {
  const r = parseKeys(wrap([full, fn, any]))
  assert.equal(r?.fullAccess, 1)
  assert.equal(r?.functionCall, 2)
  assert.equal(r?.keys.length, 3)
})
