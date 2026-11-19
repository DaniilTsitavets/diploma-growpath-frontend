import { labelDot } from './label-dot'

describe('labelDot', () => {
  it('always returns the same slot for a label, ignoring case', () => {
    expect(labelDot('beginner')).toBe(labelDot('Beginner'))
  })

  it('stays within the six colour slots', () => {
    for (const label of ['beginner', 'low-maintenance', 'rare', 'sensor', 'pet-friendly', 'x']) {
      expect(labelDot(label)).toBeGreaterThanOrEqual(1)
      expect(labelDot(label)).toBeLessThanOrEqual(6)
    }
  })

  it('spreads the seeded labels over different colours', () => {
    const slots = new Set(['beginner', 'low-maintenance', 'rare'].map(labelDot))
    expect(slots.size).toBeGreaterThan(1)
  })
})
