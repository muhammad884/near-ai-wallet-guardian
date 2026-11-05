export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type Analysis = {
  riskScore: number
  riskLevel: RiskLevel
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  inconclusive: boolean
  summary: string
  reasons: string[]
  indicators: string[]
  recommendations: string[]
  uncertainties: string[]
}

export type AiOutcome =
  | { state: 'GEMINI'; model: string; analysis: Analysis }
  | { state: 'UNAVAILABLE'; reason: string; message: string }

export type AiRequest =
  | { kind: 'account'; account: string }
  | {
      kind: 'transaction'
      tx: { receiver: string; amount: number; method?: string; args?: string }
      rules?: { score: number; level: string; decision: string; findings: string[] }
    }

const LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const CONFIDENCE = ['LOW', 'MEDIUM', 'HIGH']

function rec(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null
}

function strList(v: unknown): string[] | null {
  if (!Array.isArray(v) || v.length > 8) return null
  const out: string[] = []
  for (const x of v) {
    if (typeof x !== 'string' || x.length > 400) return null
    out.push(x)
  }
  return out
}

export function parseAnalysis(v: unknown): Analysis | null {
  const o = rec(v)
  if (!o) return null
  const score = o.riskScore
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 100) return null
  const level = o.riskLevel
  const conf = o.confidence
  if (typeof level !== 'string' || !LEVELS.includes(level)) return null
  if (typeof conf !== 'string' || !CONFIDENCE.includes(conf)) return null
  if (typeof o.inconclusive !== 'boolean') return null
  if (typeof o.summary !== 'string' || o.summary.length === 0 || o.summary.length > 500) return null
  const reasons = strList(o.reasons)
  const indicators = strList(o.indicators)
  const recommendations = strList(o.recommendations)
  const uncertainties = strList(o.uncertainties)
  if (!reasons || !indicators || !recommendations || !uncertainties) return null
  return {
    riskScore: score,
    riskLevel: level as RiskLevel,
    confidence: conf as Analysis['confidence'],
    inconclusive: o.inconclusive,
    summary: o.summary,
    reasons,
    indicators,
    recommendations,
    uncertainties,
  }
}

function unavailable(reason: string, message: string): AiOutcome {
  return { state: 'UNAVAILABLE', reason, message }
}

export function parseAiReply(json: unknown): AiOutcome {
  const o = rec(json)
  if (!o) return unavailable('BAD_REPLY', 'The server sent an unreadable reply.')
  if (o.status === 'ok' && o.source === 'GEMINI') {
    const analysis = parseAnalysis(o.analysis)
    if (!analysis) {
      return unavailable('BAD_REPLY', 'The answer failed the safety checks and was discarded.')
    }
    const model = typeof o.model === 'string' ? o.model.slice(0, 60) : 'unknown model'
    return { state: 'GEMINI', model, analysis }
  }
  const reason = typeof o.reason === 'string' ? o.reason.slice(0, 40) : 'BAD_REPLY'
  const message =
    typeof o.message === 'string' && o.message.length <= 200 ? o.message : 'Gemini was not used.'
  return unavailable(reason, message)
}

export async function askGemini(
  req: AiRequest,
  opts: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<AiOutcome> {
  const doFetch = opts.fetchImpl ?? fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 44000)
  try {
    const res = await doFetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    })
    let json: unknown = null
    try {
      json = await res.json()
    } catch {
      json = null
    }
    return parseAiReply(json)
  } catch (e) {
    const timedOut = e instanceof Error && e.name === 'AbortError'
    return unavailable(
      timedOut ? 'TIMEOUT' : 'NETWORK',
      timedOut ? 'Gemini took too long to answer.' : 'Could not reach the server.',
    )
  } finally {
    clearTimeout(timer)
  }
}

export function transactionRequest(
  input: { receiver: string; amount: number; method?: string; args?: string },
  rules: { score: number; level: string; verdict: string; findings: { text: string }[] },
): AiRequest {
  const tx: { receiver: string; amount: number; method?: string; args?: string } = {
    receiver: input.receiver,
    amount: input.amount,
  }
  if (input.method) tx.method = input.method
  if (input.args) tx.args = input.args
  return {
    kind: 'transaction',
    tx,
    rules: {
      score: rules.score,
      level: rules.level,
      decision: rules.verdict,
      findings: rules.findings.slice(0, 10).map((f) => f.text.slice(0, 200)),
    },
  }
}

