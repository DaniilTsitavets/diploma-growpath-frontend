export { formatMoney as formatPrice } from '@/shared/config/currency'

export function discountedCents(priceCents: number, discountPct: number): number {
  return Math.round((priceCents * (100 - discountPct)) / 100)
}
