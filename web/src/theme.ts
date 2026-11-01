import { useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'

function read(): Theme {
  try {
    return localStorage.getItem('theme') === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

let current: Theme = read()
const listeners = new Set<() => void>()

export function setTheme(t: Theme) {
  current = t
  document.documentElement.setAttribute('data-theme', t)
  try {
    localStorage.setItem('theme', t)
  } catch {
    // storage may be blocked; the choice then lasts only for this visit
  }
  listeners.forEach((l) => l())
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    () => current,
  )
}
