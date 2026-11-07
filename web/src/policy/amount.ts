const DECIMALS = 24
const SCALE = 10n ** 24n

export function decimalToYocto(value: string | number): bigint | null {
  if (typeof value === 'number' && !Number.isFinite(value)) return null

  let text = String(value).trim()

  if (typeof value === 'number' && /e/i.test(text)) {
    const [coefficient, exponentText] = text.toLowerCase().split('e')
    const exponent = Number(exponentText)
    const [whole, fraction = ''] = coefficient.split('.')
    const digits = whole + fraction
    const point = whole.length + exponent

    text = point <= 0
      ? '0.' + '0'.repeat(-point) + digits
      : point >= digits.length
        ? digits + '0'.repeat(point - digits.length)
        : digits.slice(0, point) + '.' + digits.slice(point)
  }

  if (!/^\d+(\.\d+)?$/.test(text)) return null

  const [whole = '0', fraction = ''] = text.split('.')
  if (fraction.length > DECIMALS) return null

  try {
    return BigInt(whole) * SCALE +
      BigInt((fraction + '0'.repeat(DECIMALS)).slice(0, DECIMALS))
  } catch {
    return null
  }
}

export function yoctoToDecimal(value: bigint): string {
  const negative = value < 0n
  const absolute = negative ? -value : value
  const digits = absolute.toString().padStart(DECIMALS + 1, '0')
  const whole = digits.slice(0, -DECIMALS)
  const fraction = digits.slice(-DECIMALS).replace(/0+$/, '')
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}
