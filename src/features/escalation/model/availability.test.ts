import type { Entitlement } from '@/features/entitlement/model/types'
import { expertAvailability } from './availability'

const entitlement = (tier: Entitlement['tier'], used: number, limit: number): Entitlement => ({
  user_id: 'u',
  tier,
  tier_expires_at: null,
  ai_quota_today: { used: 0, limit: 3 },
  expert_quota_30_days: { used, limit },
})

describe('expertAvailability', () => {
  it('is available while consultations are left', () => {
    expect(expertAvailability(entitlement('hobbyist', 1, 2))).toEqual({
      available: true,
      left: 1,
      limit: 2,
    })
  })

  it('points a Starter user to the Hobbyist plan with 0 of 0', () => {
    const result = expertAvailability(entitlement('starter', 0, 0))
    expect(result).toMatchObject({ available: false, left: 0, limit: 0 })
    expect(result).toHaveProperty('reason', expect.stringContaining('Hobbyist') as string)
  })

  it('names the next plan when a higher tier used everything', () => {
    const result = expertAvailability(entitlement('hobbyist', 2, 2))
    expect(result).toHaveProperty('reason', expect.stringContaining('Premium') as string)
  })

  it('names no plan at the top tier', () => {
    const result = expertAvailability(entitlement('premium', 5, 5))
    expect(result).toHaveProperty('reason', 'You used all expert consultations of this period.')
  })
})
