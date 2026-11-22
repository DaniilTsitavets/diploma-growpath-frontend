import { Link } from 'react-router'
import { Icon, type IconName } from '@/shared/ui/Icon'
import { formatDateTime } from '../model/dates'
import type { PlantUpdate } from '../model/types'
import styles from './UpdateList.module.css'

const statuses: Record<string, { label: string; icon: IconName }> = {
  diagnosis_pending: { label: 'Diagnosis pending', icon: 'clock' },
  awaiting_clarification: { label: 'Needs your answer', icon: 'alert' },
  completed: { label: 'Diagnosed', icon: 'check' },
  degraded: { label: 'Diagnosis unavailable', icon: 'alert' },
}

const noDiagnosis = { label: 'No diagnosis yet', icon: 'clock' } as const

export function UpdateList({ journalId, updates }: { journalId: string; updates: PlantUpdate[] }) {
  return (
    <ul className={styles.list}>
      {updates.map((update) => {
        const status = update.diagnosis
          ? (statuses[update.diagnosis.status] ?? noDiagnosis)
          : noDiagnosis
        return (
          <li key={update.id} className={styles.item}>
            <span className={styles.marker}>
              <Icon name="camera" />
            </span>
            <div className={styles.body}>
              <Link to={`/journals/${journalId}/updates/${update.id}`} className={styles.link}>
                Update from {formatDateTime(update.created_at)}
              </Link>
              <span className={styles.status}>
                <Icon name={status.icon} size={16} />
                {status.label}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
