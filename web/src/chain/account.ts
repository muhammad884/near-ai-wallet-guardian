// Reads one account from the NEAR testnet RPC (view_account). Real data only.
export type AccountOutcome =
  | {
      state: 'FOUND'
      account: string
      balanceNear: string
      hasContract: boolean
      storageBytes: number | null
      blockHeight: number | null
    }
  | { state: 'NOT_FOUND'; account: string }
  | { state: 'INVALID'; message: string }
  | { state: 'UNAVAILABLE'; message: string }

export const TESTNET_RPC = 'https://rpc.testnet.near.org'
export const MAINNET_RPC = 'https://rpc.mainnet.near.org'
const NO_CONTRACT = '11111111111111111111111111111111'
const NAME = /^[a-z0-9]+([-_.][a-z0-9]+)*$/

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>

function rec(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null
}

export function yoctoToNearText(yocto: string): string | null {
  if (!/^[0-9]+$/.test(yocto)) return null
  const p = yocto.padStart(25, '0')
  const whole = p.slice(0, -24).replace(/^0+(?=\d)/, '')
  const frac = p.slice(-24).replace(/0+$/, '')
  return frac ? `${whole}.${frac}` : whole
}

export function parseViewAccount(response: unknown, account: string): AccountOutcome | null {
  const r = rec(response)
  if (!r) return null
  const err = rec(r.error)
  if (err) {
    const cause = rec(err.cause)
    const data = typeof err.data === 'string' ? err.data : ''
    if (cause?.name === 'UNKNOWN_ACCOUNT' || /does not exist/i.test(data)) {
      return { state: 'NOT_FOUND', account }
    }
    return null
  }
  const res = rec(r.result)
  if (!res || typeof res.amount !== 'string' || typeof res.code_hash !== 'string') return null
  const balanceNear = yoctoToNearText(res.amount)
  if (balanceNear === null) return null
  return {
    state: 'FOUND',
    account,
    balanceNear,
    hasContract: res.code_hash !== NO_CONTRACT,
    storageBytes: typeof res.storage_usage === 'number' ? res.storage_usage : null,
    blockHeight: typeof res.block_height === 'number' ? res.block_height : null,
  }
}

export async function lookupAccount(
  account: string,
  opts: { fetchImpl?: FetchLike; rpc?: string; timeoutMs?: number; retries?: number } = {},
): Promise<AccountOutcome> {
  const id = account.trim()
  if (id.length < 2 || id.length > 64 || !NAME.test(id)) {
    return { state: 'INVALID', message: 'Not a valid NEAR account name.' }
  }
  const f = opts.fetchImpl ?? (fetch as unknown as FetchLike)
  const rpc = opts.rpc ?? TESTNET_RPC
  const timeoutMs = opts.timeoutMs ?? 8000
  const retries = opts.retries ?? 1
  let last = 'Could not reach the NEAR RPC.'
  for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await f(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'guardian',
          method: 'query',
          params: { request_type: 'view_account', finality: 'final', account_id: id },
        }),
      })
      if (res.status >= 500) {
        last = 'The NEAR RPC is busy.'
        continue
      }
      const parsed = parseViewAccount(await res.json(), id)
      if (parsed) return parsed
      return { state: 'UNAVAILABLE', message: 'Unexpected answer from the NEAR RPC.' }
    } catch {
      last = ctrl.signal.aborted ? 'The NEAR RPC took too long.' : 'Could not reach the NEAR RPC.'
    } finally {
      clearTimeout(t)
    }
  }
  return { state: 'UNAVAILABLE', message: last }
}

export async function lookupBothNetworks(account: string): Promise<{
  mainnet: AccountOutcome
  testnet: AccountOutcome
}> {
  const [mainnet, testnet] = await Promise.all([
    lookupAccount(account, { rpc: MAINNET_RPC }),
    lookupAccount(account, { rpc: TESTNET_RPC }),
  ])

  return { mainnet, testnet }
}
