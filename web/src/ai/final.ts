import type { Decision } from '../policy/types'
import type { AiOutcome } from './client'

// The policy engine is the only authority. Gemini can never change the verdict.
export function finalVerdict(policy: Decision, _ai: AiOutcome | null): Decision {
  return policy
}

export function aiCaution(policy: Decision | null, ai: AiOutcome): string | null {
  if (ai.state !== 'GEMINI') return null
  const level = ai.analysis.riskLevel
  const high = level === 'HIGH' || level === 'CRITICAL'
  if (policy === 'BLOCKED') {
    return level === 'LOW'
      ? 'Gemini rated this low, but your policy still blocks it. The policy decision stands.'
      : null
  }
  if (!high) return null
  return policy === null
    ? 'Gemini sees more risk than the name rules did. This is an opinion, not proof.'
    : 'Gemini sees more risk than the rules did. The app decision is unchanged. Review it yourself before you proceed.'
}
