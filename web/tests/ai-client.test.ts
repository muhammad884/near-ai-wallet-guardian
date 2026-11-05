import { test } from 'node:test'
import assert from 'node:assert/strict'
import { askGemini, parseAiReply, transactionRequest } from '../src/ai/client.ts'
import { aiCaution, finalVerdict } from '../src/ai/final.ts'

const analysis = {
  riskScore: 40, riskLevel: 'MEDIUM', confidence: 'LOW', inconclusive: true,
  summary: 'Not enough data.', reasons: ['r'], indicators: [], recommendations: ['x'], uncertainties: ['u'],
}
const okReply = { status: 'ok', source: 'GEMINI', model: 'gemini-2.5-flash-lite', analysis }
const respond = (body: any) => (async () => ({ ok: true, status: 200, json: async () => body })) as any
const gemini = (level: string): any => ({ state: 'GEMINI', model: 'm', analysis: { ...analysis, riskLevel: level } })
const down: any = { state: 'UNAVAILABLE', reason: 'NO_KEY', message: 'x' }

test('a valid server reply becomes a Gemini outcome', () => {
  const o: any = parseAiReply(okReply)
  assert.equal(o.state, 'GEMINI')
  assert.equal(o.model, 'gemini-2.5-flash-lite')
  assert.equal(o.analysis.riskScore, 40)
})

test('malformed replies are never shown as Gemini answers', () => {
  const bad: any[] = [
    null, 'x', 5, {}, { status: 'ok' }, { status: 'ok', source: 'GEMINI' },
    { status: 'ok', source: 'OTHER', analysis },
    { ...okReply, analysis: { ...analysis, riskScore: 120 } },
    { ...okReply, analysis: { ...analysis, riskScore: 1.5 } },
    { ...okReply, analysis: { ...analysis, summary: '' } },
    { ...okReply, analysis: { ...analysis, riskLevel: 'SAFE' } },
    { ...okReply, analysis: { ...analysis, reasons: 'text' } },
  ]
  for (const b of bad) assert.equal(parseAiReply(b).state, 'UNAVAILABLE')
})

test('a fallback reply keeps its reason and a short message', () => {
  const o: any = parseAiReply({ status: 'fallback', reason: 'QUOTA', message: 'quota used' })
  assert.equal(o.state, 'UNAVAILABLE')
  assert.equal(o.reason, 'QUOTA')
  assert.equal(o.message, 'quota used')
  const long: any = parseAiReply({ status: 'fallback', reason: 'X', message: 'y'.repeat(300) })
  assert.equal(long.message, 'Gemini was not used.')
})

test('askGemini posts to our own endpoint and returns the outcome', async () => {
  let seen: any = null
  const fetchImpl = (async (url: string, init: any) => {
    seen = { url, init }
    return { ok: true, status: 200, json: async () => okReply }
  }) as any
  const req = { kind: 'account', account: 'wrap.near' } as const
  const o = await askGemini(req, { fetchImpl })
  assert.equal(o.state, 'GEMINI')
  assert.equal(seen.url, '/api/analyze')
  assert.equal(seen.init.method, 'POST')
  assert.deepEqual(JSON.parse(seen.init.body), req)
})

test('every client-side failure is a labelled outcome, never a fake answer', async () => {
  const req = { kind: 'account', account: 'a.near' } as const
  let o: any = await askGemini(req, { fetchImpl: (async () => { throw new Error('offline') }) as any })
  assert.deepEqual([o.state, o.reason], ['UNAVAILABLE', 'NETWORK'])
  const brokenJson = (async () => ({ ok: true, status: 200, json: async () => { throw new Error('x') } })) as any
  o = await askGemini(req, { fetchImpl: brokenJson })
  assert.deepEqual([o.state, o.reason], ['UNAVAILABLE', 'BAD_REPLY'])
  o = await askGemini(req, {
    fetchImpl: respond({ status: 'error', reason: 'BAD_INPUT', message: 'Enter a valid NEAR account ID.' }),
  })
  assert.deepEqual([o.state, o.reason], ['UNAVAILABLE', 'BAD_INPUT'])
  const hang = ((_u: string, init: any) => new Promise((_ok, fail) => {
    init.signal.addEventListener('abort', () => fail(Object.assign(new Error('aborted'), { name: 'AbortError' })))
  })) as any
  o = await askGemini(req, { fetchImpl: hang, timeoutMs: 20 })
  assert.deepEqual([o.state, o.reason], ['UNAVAILABLE', 'TIMEOUT'])
})

test('the transaction request is small and trimmed', () => {
  const findings = Array.from({ length: 14 }, (_v, i) => ({ text: 'f'.repeat(250) + i }))
  const r: any = transactionRequest(
    { receiver: 'a.near', amount: 2, method: undefined, args: undefined },
    { score: 20, level: 'LOW', verdict: 'APPROVED', findings },
  )
  assert.equal(r.kind, 'transaction')
  assert.deepEqual(r.tx, { receiver: 'a.near', amount: 2 })
  assert.equal(r.rules.findings.length, 10)
  assert.ok(r.rules.findings.every((f: string) => f.length <= 200))
  assert.equal(r.rules.decision, 'APPROVED')
  const r2: any = transactionRequest(
    { receiver: 'a.near', amount: 1, method: 'ft_transfer', args: '{}' },
    { score: 0, level: 'LOW', verdict: 'APPROVED', findings: [] },
  )
  assert.equal(r2.tx.method, 'ft_transfer')
  assert.equal(r2.tx.args, '{}')
})

test('Gemini can never change the policy verdict', () => {
  const verdicts: any[] = ['APPROVED', 'REQUIRES_APPROVAL', 'BLOCKED']
  const outcomes: any[] = [null, down, gemini('LOW'), gemini('MEDIUM'), gemini('HIGH'), gemini('CRITICAL')]
  for (const v of verdicts) for (const o of outcomes) assert.equal(finalVerdict(v, o), v)
})

test('cautions explain a disagreement without changing anything', () => {
  assert.match(String(aiCaution('BLOCKED', gemini('LOW'))), /still blocks/)
  assert.equal(aiCaution('BLOCKED', gemini('CRITICAL')), null)
  assert.match(String(aiCaution('APPROVED', gemini('HIGH'))), /decision is unchanged/)
  assert.match(String(aiCaution('REQUIRES_APPROVAL', gemini('CRITICAL'))), /decision is unchanged/)
  assert.equal(aiCaution('APPROVED', gemini('LOW')), null)
  assert.match(String(aiCaution(null, gemini('HIGH'))), /not proof/)
  assert.equal(aiCaution('APPROVED', down), null)
})
