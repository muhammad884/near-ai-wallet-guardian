const PREFIX = 'awg:'

export type Backend = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const memory = new Map<string, string>()
let override: Backend | null | undefined

function backend(): Backend | null {
  if (override !== undefined) return override
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage ?? null
  } catch {
    return null
  }
}

export function setBackend(b: Backend | null): void {
  override = b
}

export function resetStorageForTests(): void {
  memory.clear()
  override = undefined
}

export function loadJson(key: string): unknown {
  const k = PREFIX + key
  let raw: string | null
  try {
    raw = backend()?.getItem(k) ?? memory.get(k) ?? null
  } catch {
    raw = memory.get(k) ?? null
  }
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveJson(key: string, value: unknown): void {
  const k = PREFIX + key
  const text = JSON.stringify(value)
  memory.set(k, text)
  try {
    backend()?.setItem(k, text)
  } catch {
    // storage is full or blocked: the app keeps working from memory
  }
}

export function removeKey(key: string): void {
  const k = PREFIX + key
  memory.delete(k)
  try {
    backend()?.removeItem(k)
  } catch {
    // ignore
  }
}
