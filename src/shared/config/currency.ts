/** The one currency of the shop; every amount arrives in cents (price_cents, list_price_cents, ...). */
export const CURRENCY = 'EUR'

const money = new Intl.NumberFormat('en', { style: 'currency', currency: CURRENCY })

export function formatMoney(cents: number): string {
  return money.format(cents / 100)
}
