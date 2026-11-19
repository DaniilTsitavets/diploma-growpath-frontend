import { isExhausted, nextTier, remaining, upgradeHint } from './tiers'

describe('tiers', () => {
  it('names the next tier only', () => {
    expect(nextTier('starter')).toBe('hobbyist')
    expect(nextTier('hobbyist')).toBe('premium')
    expect(nextTier('premium')).toBeNull()
    expect(upgradeHint('starter')).toContain('Hobbyist')
    expect(upgradeHint('premium')).toBeNull()
  })

  it('computes the remaining quota without going below zero', () => {
    expect(remaining({ used: 1, limit: 3 })).toBe(2)
    expect(remaining({ used: 5, limit: 3 })).toBe(0)
    expect(isExhausted({ used: 0, limit: 0 })).toBe(true)
    expect(isExhausted({ used: 2, limit: 3 })).toBe(false)
  })
})
