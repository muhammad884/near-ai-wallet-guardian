let sentTotal = 0

export function getSentTotal(): number {
  return sentTotal
}

export function addSent(n: number) {
  if (Number.isFinite(n) && n > 0) sentTotal += n
}
