import { Buffer } from 'buffer'

const g = globalThis as unknown as { Buffer?: typeof Buffer }
if (!g.Buffer) {
  g.Buffer = Buffer
}

const w = globalThis as unknown as { global?: unknown }
if (!w.global) {
  w.global = globalThis
}
