import { useSyncExternalStore } from 'react'

// undefined = not checked yet, null = disconnected, string = account ID
let account: string | null | undefined = undefined
const listeners = new Set<() => void>()

export function setWalletAccount(next: string | null) {
  account = next
  listeners.forEach((l) => l())
}

export function useWalletAccount(): string | null | undefined {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    () => account,
  )
}
