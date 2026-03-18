export function formatCurrency(
  amountInSmallestUnit: number | string,
  currency: string = 'USD'
): string {
  const amount = Number(amountInSmallestUnit) / 100
  const normalizedAmount = Number.isFinite(amount) ? amount : 0

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(normalizedAmount)
}

export function toSmallestUnit(amount: number): number {
  return Math.round(amount * 100)
}

export function fromSmallestUnit(amount: number): number {
  return amount / 100
}
