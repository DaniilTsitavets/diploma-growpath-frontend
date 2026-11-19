import { Link } from 'react-router'
import { formatDateTime } from '../model/dates'
import type { PlantUpdate } from '../model/types'
import styles from './UpdateList.module.css'

const statusLabels: Record<string, string> = {
  diagnosis_pending: 'Diagnosis pending',
  awaiting_clarification: 'Needs your answer',
  completed: 'Diagnosed',
  degraded: 'Diagnosis unavailable',
}

export function UpdateList({ journalId, updates }: { journalId: string; updates: PlantUpdate[] }) {
  return (
    <ul className={styles.list}>
      {updates.map((update) => (
        <li key={update.id} className={styles.item}>
          <Link to={`/journals/${journalId}/updates/${update.id}`}>
            Update from {formatDateTime(update.created_at)}
          </Link>
          <span className={styles.meta}>
            {update.diagnosis ? statusLabels[update.diagnosis.status] : 'No diagnosis yet'}
          </span>
        </li>
      ))}
    </ul>
  )
}
