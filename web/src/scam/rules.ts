export type Level = 'INVALID' | 'NO SIGNS FOUND' | 'LOW' | 'MEDIUM' | 'HIGH'

export type Signal = { points: number; text: string; evidence: string }

export type ScamReport = {
  account: string
  level: Level
  score: number
  signals: Signal[]
  notChecked: string[]
  confidence: string
  source: string
  advice: string
}

const ACCOUNT_ID = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/

const KNOWN = [
  'wrap.near',
  'aurora',
  'token.sweat',
  'v2.ref-finance.near',
  'usdt.tether-token.near',
]

const WORDS = [
  'airdrop', 'giveaway', 'claim', 'reward', 'bonus',
  'official', 'support', 'verify', 'double',
]

export const NOT_CHECKED = [
  'Whether the account exists',
  'Account age and balance',
  'Transaction history',
  'Smart contract code',
  'Reports from the community or other scam lists',
]

function distance(a: string, b: string): number {
  let prev: number[] = []
  for (let j = 0; j <= b.length; j++) prev.push(j)
  for (let i = 1; i <= a.length; i++) {
    const row: number[] = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row.push(
        Math.min(
          (prev[j] ?? 0) + 1,
          (row[j - 1] ?? 0) + 1,
          (prev[j - 1] ?? 0) + cost,
        ),
      )
    }
    prev = row
  }
  return prev[b.length] ?? 0
}

function collect(account: string): Signal[] {
  const out: Signal[] = []
  const add = (points: number, text: string, evidence: string) =>
    out.push({ points, text, evidence })
  const implicit = /^[0-9a-f]{64}$/.test(account)

  for (const k of KNOWN) {
    if (account === k) continue
    const d = distance(account, k)
    if (d === 1 || (d === 2 && k.length >= 9)) {
      add(
        50,
        `Looks very similar to "${k}" but is a different name.`,
        `The spelling differs from "${k}" by ${d} character edit(s).`,
      )
    }
  }

  for (const w of WORDS) {
    if (account.includes(w)) {
      add(
        20,
        `Contains the word "${w}".`,
        `The name contains "${w}". This word shows up in scam bait, but also in honest names.`,
      )
    }
  }

  if (!implicit) {
    const digits = (account.match(/\d/g) ?? []).length
    if (digits >= 6) add(10, 'Many digits in the name.', `${digits} digits found.`)
    if (account.length > 40) {
      add(10, 'Very long name.', `${account.length} characters.`)
    }
  }

  if (
    account.includes('near') &&
    account !== 'near' &&
    !account.endsWith('.near') &&
    !account.endsWith('.testnet')
  ) {
    add(
      10,
      'Has "near" in the name but does not end in .near or .testnet.',
      'It may be imitating an official-looking name.',
    )
  }

  return out
}

export function analyze(raw: string): ScamReport {
  const account = raw.trim().toLowerCase()
  const base = {
    account,
    notChecked: NOT_CHECKED,
    source: 'Fixed rules written by hand. Nothing was read from the blockchain.',
  }

  const implicit = /^[0-9a-f]{64}$/.test(account)
  const valid =
    account.length >= 2 &&
    account.length <= 64 &&
    (implicit || ACCOUNT_ID.test(account))

  if (!valid) {
    return {
      ...base,
      level: 'INVALID',
      score: 0,
      signals: [],
      confidence: 'High, but only for the format check.',
      advice: 'This is not a valid NEAR account ID. Check that you copied it correctly.',
    }
  }

  const signals = collect(account)
  const score = Math.min(100, signals.reduce((s, x) => s + x.points, 0))
  const level: Level =
    signals.length === 0 ? 'NO SIGNS FOUND'
    : score >= 50 ? 'HIGH'
    : score >= 20 ? 'MEDIUM'
    : 'LOW'

  const advice =
    level === 'NO SIGNS FOUND'
      ? 'No signs found in the name alone. This does not mean the account is safe. Look it up on a block explorer before sending anything.'
      : level === 'HIGH'
        ? 'Strong warning signs in the name. Do not send funds until you have confirmed the exact name from a source you trust.'
        : 'Some warning signs found. Double-check the exact name with the person or site that gave it to you.'

  return {
    ...base,
    level,
    score,
    signals,
    confidence: 'Low. Only the spelling of the name was checked.',
    advice,
  }
}
