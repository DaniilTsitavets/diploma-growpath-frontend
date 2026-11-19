import { nextTier, remaining, tierLabels } from '@/features/entitlement/model/tiers'
import type { Entitlement } from '@/features/entitlement/model/types'

export type ExpertAvailability =
  | { available: true; left: number; limit: number }
  | { available: false; left: number; limit: number; reason: string }

/** Decided from the entitlement, not from the result of an attempt. */
export function expertAvailability(entitlement: Entitlement): ExpertAvailability {
  const quota = entitlement.expert_quota_30_days
  const left = remaining(quota)
  if (left > 0) return { available: true, left, limit: quota.limit }

  const next = nextTier(entitlement.tier)
  const reason =
    quota.limit === 0 && next
      ? `Expert consultations are available from the ${tierLabels[next]} plan.`
      : next
        ? `You used all expert consultations of this period. The ${tierLabels[next]} plan includes more.`
        : 'You used all expert consultations of this period.'
  return { available: false, left, limit: quota.limit, reason }
}
