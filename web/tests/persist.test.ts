import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { resetStorageForTests, setBackend } from '../src/storage.ts'
import {
  addEvent, clearEvents, getEvents, MAX_EVENTS, parseEvents, reloadEvents,
} from '../src/log/store.ts'
import { getAgents, parseAgents, reloadAgents, setAgents } from '../src/agents/store.ts'
import {
  defaultPolicy, getActivePolicy, parsePolicy, reloadPolicy, setActivePolicy,
} from '../src/policy/active.ts'
import { addSent, addSentExact, getSentTotal, getSentTotalExact, getAgentSentTotalExact, parseSent } from '../src/send/session.ts'
import type { Agent } from '../src/agents/model.ts'

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(initial))
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v) },
    removeItem: (k: string) => { map.delete(k) },
    map,
  }
}

beforeEach(() => { resetStorageForTests() })

const ev = { source: 'T', summary: 'x', outcome: 'APPROVED', tone: 'ok' as const }

test('history is saved and restored after a restart', () => {
  const s = fakeStorage()
  setBackend(s)
  clearEvents()
  addEvent({ ...ev, summary: 'one' })
  addEvent({ ...ev, summary: 'two' })
  assert.ok(s.map.has('awg:events'))
  const again = fakeStorage(Object.fromEntries(s.map))
  resetStorageForTests()
  setBackend(again)
  reloadEvents()
  assert.equal(getEvents().length, 2)
  assert.equal(getEvents()[0]?.summary, 'two')
})

test('history keeps at most 200 records, newest first', () => {
  setBackend(fakeStorage())
  clearEvents()
  for (let i = 0; i < MAX_EVENTS + 5; i++) addEvent({ ...ev, summary: 'n' + i })
  assert.equal(getEvents().length, MAX_EVENTS)
  assert.equal(getEvents()[0]?.summary, 'n' + (MAX_EVENTS + 4))
})

test('clearing history removes the saved copy too', () => {
  const s = fakeStorage()
  setBackend(s)
  addEvent(ev)
  assert.ok(s.map.has('awg:events'))
  clearEvents()
  assert.equal(s.map.has('awg:events'), false)
  reloadEvents()
  assert.equal(getEvents().length, 0)
})

test('corrupted or invalid saved history is ignored safely', () => {
  setBackend(fakeStorage({ 'awg:events': '{not json' }))
  reloadEvents()
  assert.equal(getEvents().length, 0)
  assert.deepEqual(parseEvents('nope'), [])
  assert.deepEqual(parseEvents([null, 1, {}, { id: 'x' }]), [])
  const good = { id: 1, time: 't', source: 's', summary: 'm', outcome: 'o', tone: 'ok' }
  assert.equal(parseEvents([good, { ...good, tone: 'weird' }]).length, 1)
})

test('the app keeps working when storage is unavailable', () => {
  const boom = () => { throw new Error('blocked') }
  setBackend({ getItem: boom, setItem: boom, removeItem: boom })
  clearEvents()
  addEvent(ev)
  assert.equal(getEvents().length, 1)
})

test('the daily sent total persists, and a new day starts at zero', () => {
  const s = fakeStorage()
  setBackend(s)
  assert.equal(getSentTotal(), 0)
  addSent(1.5)
  addSent(2)
  assert.equal(getSentTotal(), 3.5)
  const again = fakeStorage(Object.fromEntries(s.map))
  resetStorageForTests()
  setBackend(again)
  assert.equal(getSentTotal(), 3.5)
  assert.equal(parseSent({ day: '2000-01-01', total: 9 }, '2026-11-04'), 0)
  assert.equal(parseSent({ day: '2026-11-04', total: -1 }, '2026-11-04'), 0)
  assert.equal(parseSent('junk', '2026-11-04'), 0)
})

test('invalid amounts are never added to the sent total', () => {
  setBackend(fakeStorage())
  addSent(Number.NaN)
  addSent(-1)
  addSent(0)
  assert.equal(getSentTotal(), 0)
})

const agent: Agent = {
  id: 'a1', name: 'Trader-1', enabled: true, maxPerTx: 5, maxDaily: 20,
  approvalAbove: 2, allowedContracts: ['wrap.near'], allowedMethods: ['ft_transfer'],
}

test('agent profiles are saved and restored', () => {
  const s = fakeStorage()
  setBackend(s)
  setAgents([agent, { ...agent, id: 'a2', name: 'Helper', enabled: false }])
  const again = fakeStorage(Object.fromEntries(s.map))
  resetStorageForTests()
  setBackend(again)
  reloadAgents()
  assert.equal(getAgents().length, 2)
  assert.deepEqual(getAgents()[0], agent)
  assert.equal(getAgents()[1]?.enabled, false)
})

test('editing and removing an agent updates the saved copy', () => {
  setBackend(fakeStorage())
  setAgents([agent])
  setAgents([{ ...agent, enabled: false }])
  reloadAgents()
  assert.equal(getAgents()[0]?.enabled, false)
  setAgents([])
  reloadAgents()
  assert.equal(getAgents().length, 0)
})

test('invalid saved agents are dropped', () => {
  assert.deepEqual(parseAgents('x'), [])
  assert.deepEqual(
    parseAgents([{}, null, { ...agent, maxPerTx: -1 }, { ...agent, name: '' }]),
    [],
  )
  assert.equal(parseAgents([agent, { ...agent, enabled: 'yes' }]).length, 1)
  setBackend(fakeStorage({ 'awg:agents': '[[[' }))
  reloadAgents()
  assert.equal(getAgents().length, 0)
})

test('the applied policy is saved and restored', () => {
  const s = fakeStorage()
  setBackend(s)
  setActivePolicy({ ...defaultPolicy, maxPerTx: 3, approvalAbove: 1 })
  const again = fakeStorage(Object.fromEntries(s.map))
  resetStorageForTests()
  setBackend(again)
  reloadPolicy()
  assert.equal(getActivePolicy().maxPerTx, 3)
  assert.equal(getActivePolicy().approvalAbove, 1)
  setActivePolicy(defaultPolicy)
})

test('a damaged or tampered saved policy falls back to the default', () => {
  setBackend(fakeStorage({ 'awg:policy': '{broken' }))
  reloadPolicy()
  assert.equal(getActivePolicy().maxPerTx, defaultPolicy.maxPerTx)
  assert.equal(parsePolicy({ ...defaultPolicy, maxPerTx: 999 }), null)
  assert.equal(parsePolicy({ ...defaultPolicy, maxPerTx: 'x' }), null)
  assert.equal(parsePolicy({ ...defaultPolicy, allowedContracts: ['Bad Name!'] }), null)
  assert.equal(parsePolicy(null), null)
  assert.ok(parsePolicy(defaultPolicy))
})


test('exact spending preserves 24 decimal places', () => {
  setBackend(fakeStorage())
  addSentExact('0.000000000000000000000001', 'a1')
  assert.equal(getSentTotalExact(), '0.000000000000000000000001')
  assert.equal(getAgentSentTotalExact('a1'), '0.000000000000000000000001')
})

test('exact spending persists after restart', () => {
  const s = fakeStorage()
  setBackend(s)
  addSentExact('1.000000000000000000000001', 'a1')
  addSentExact('0.000000000000000000000002', 'a1')

  const again = fakeStorage(Object.fromEntries(s.map))
  resetStorageForTests()
  setBackend(again)

  assert.equal(getSentTotalExact(), '1.000000000000000000000003')
  assert.equal(getAgentSentTotalExact('a1'), '1.000000000000000000000003')
})

test('exact spending keeps agent totals separate', () => {
  setBackend(fakeStorage())
  addSentExact('1.000000000000000000000001', 'a1')
  addSentExact('2.000000000000000000000002', 'a2')

  assert.equal(getAgentSentTotalExact('a1'), '1.000000000000000000000001')
  assert.equal(getAgentSentTotalExact('a2'), '2.000000000000000000000002')
  assert.equal(getSentTotalExact(), '3.000000000000000000000003')
})
