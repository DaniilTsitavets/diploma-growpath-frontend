import { remaining, tierLabels } from '../model/tiers'
import type { Entitlement } from '../model/types'
import styles from './QuotaSummary.module.css'

export function QuotaSummary({ entitlement }: { entitlement: Entitlement }) {
  const ai = remaining(entitlement.ai_quota_today)
  const expert = remaining(entitlement.expert_quota_30_days)
  return (
    <dl className={styles.summary} aria-label="Your plan and limits">
      <div>
        <dt>Plan: </dt>
        <dd>{tierLabels[entitlement.tier]}</dd>
      </div>
      <div>
        <dt>AI checks left today: </dt>
        <dd>
          {ai} of {entitlement.ai_quota_today.limit}
        </dd>
      </div>
      <div>
        <dt>Expert consultations left: </dt>
        <dd>
          {expert} of {entitlement.expert_quota_30_days.limit}
        </dd>
      </div>
    </dl>
  )
}
