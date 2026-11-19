const amount = new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatPrice(cents: number): string {
  return amount.format(cents / 100)
}

export function discountedCents(priceCents: number, discountPct: number): number {
  return Math.round((priceCents * (100 - discountPct)) / 100)
}
