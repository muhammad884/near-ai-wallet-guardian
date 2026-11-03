const ACCOUNT_ID = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/
const DECIMALS = 24

export function nearToYocto(text: string): bigint | null {
  const t = text.trim()
  if (!/^\d+(\.\d+)?$/.test(t)) return null
  const parts = t.split('.')
  const whole = parts[0] ?? '0'
  const frac = parts[1] ?? ''
  if (frac.length > DECIMALS) return null
  const padded = (frac + '0'.repeat(DECIMALS)).slice(0, DECIMALS)
  return BigInt(whole + padded)
}

export function yoctoToNear(y: bigint): string {
  const s = y.toString().padStart(DECIMALS + 1, '0')
  const whole = s.slice(0, s.length - DECIMALS)
  const frac = s.slice(s.length - DECIMALS).replace(/0+$/, '')
  return frac ? whole + '.' + frac : whole
}

export type SendCheck =
  | { ok: true; yocto: bigint }
  | { ok: false; error: string }

export function checkSend(
  sender: string,
  receiver: string,
  amountText: string,
  balance: bigint | null,
): SendCheck {
  const to = receiver.trim()
  if (to.length < 2 || to.length > 64 || !ACCOUNT_ID.test(to)) {
    return {
      ok: false,
      error: 'The recipient is not a valid NEAR account ID (lowercase letters, digits, - _ and dots only).',
    }
  }
  if (to === 'near' || to.endsWith('.near')) {
    return {
      ok: false,
      error: 'That looks like a mainnet name. This page is testnet only. Testnet names usually end in .testnet.',
    }
  }
  if (to === sender) {
    return { ok: false, error: 'You cannot send to your own account.' }
  }
  const yocto = nearToYocto(amountText)
  if (yocto === null) {
    return {
      ok: false,
      error: 'Enter the amount as digits, like 1 or 0.5 (up to 24 decimals).',
    }
  }
  if (yocto === BigInt(0)) {
    return { ok: false, error: 'The amount must be more than zero.' }
  }
  if (balance !== null && yocto > balance) {
    return {
      ok: false,
      error: 'The amount is more than the balance of the connected account.',
    }
  }
  return { ok: true, yocto }
}
