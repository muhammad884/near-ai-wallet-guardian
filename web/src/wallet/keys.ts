export type KeyKind = 'FULL_ACCESS' | 'FUNCTION_CALL' | 'OTHER'

export type KeyInfo = {
  publicKey: string
  kind: KeyKind
  receiver: string
  methods: string[]
}

export type KeyAudit = {
  keys: KeyInfo[]
  fullAccess: number
  functionCall: number
  other: number
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null
    ? (v as Record<string, unknown>)
    : null
}

export function parseKeys(response: unknown): KeyAudit | null {
  const result = asRecord(asRecord(response)?.result)
  const raw = result?.keys
  if (!Array.isArray(raw)) return null

  const keys: KeyInfo[] = raw.map((k: unknown): KeyInfo => {
    const item = asRecord(k)
    const pk = item?.public_key
    const publicKey = typeof pk === 'string' ? pk : 'unknown'
    const perm = asRecord(item?.access_key)?.permission

    if (perm === 'FullAccess') {
      return { publicKey, kind: 'FULL_ACCESS', receiver: '', methods: [] }
    }

    const fc = asRecord(asRecord(perm)?.FunctionCall)
    if (fc) {
      const names = fc.method_names
      const methods = Array.isArray(names)
        ? names.filter((m: unknown): m is string => typeof m === 'string')
        : []
      const rid = fc.receiver_id
      return {
        publicKey,
        kind: 'FUNCTION_CALL',
        receiver: typeof rid === 'string' ? rid : '',
        methods,
      }
    }

    return { publicKey, kind: 'OTHER', receiver: '', methods: [] }
  })

  return {
    keys,
    fullAccess: keys.filter((k) => k.kind === 'FULL_ACCESS').length,
    functionCall: keys.filter((k) => k.kind === 'FUNCTION_CALL').length,
    other: keys.filter((k) => k.kind === 'OTHER').length,
  }
}
