import { CURRENCY, formatMoney } from './currency'

describe('formatMoney', () => {
  it('formats cents in the shop currency', () => {
    expect(CURRENCY).toBe('EUR')
    expect(formatMoney(2500)).toBe('€25.00')
    expect(formatMoney(1805)).toBe('€18.05')
    expect(formatMoney(0)).toBe('€0.00')
  })
})
