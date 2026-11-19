import type { QuotaUsage, Tier } from './types'

export const tierLabels: Record<Tier, string> = {
  starter: 'Starter',
  hobbyist: 'Hobbyist',
  premium: 'Premium',
}

const nextTiers: Record<Tier, Tier | null> = {
  starter: 'hobbyist',
  hobbyist: 'premium',
  premium: null,
}

export function nextTier(tier: Tier): Tier | null {
  return nextTiers[tier]
}

export const remaining = (quota: QuotaUsage) => Math.max(quota.limit - quota.used, 0)

export const isExhausted = (quota: QuotaUsage) => remaining(quota) === 0

/** Names only the next tier: how much to spend to reach it is deliberately not shown. */
export function upgradeHint(tier: Tier): string | null {
  const next = nextTier(tier)
  return next ? `A higher plan, ${tierLabels[next]}, raises this limit.` : null
}
