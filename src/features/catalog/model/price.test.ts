import { discountedCents, formatPrice } from './price'

describe('price', () => {
  it('formats cents in euros', () => {
    expect(formatPrice(2500)).toBe('€25.00')
    expect(formatPrice(1805)).toBe('€18.05')
  })

  it('applies a percentage discount', () => {
    expect(discountedCents(2500, 20)).toBe(2000)
    expect(discountedCents(1999, 10)).toBe(1799)
  })
})
