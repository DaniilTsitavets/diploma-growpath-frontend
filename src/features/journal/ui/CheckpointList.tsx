import { Link } from 'react-router'
import { Icon, type IconName } from '@/shared/ui/Icon'
import { formatDate } from '../model/dates'
import type { Checkpoint } from '../model/types'
import styles from './CheckpointList.module.css'

const states: Record<Checkpoint['state'], { label: string; icon: IconName }> = {
  upcoming: { label: 'Upcoming', icon: 'clock' },
  open: { label: 'Open now', icon: 'dot' },
  passed: { label: 'Passed', icon: 'check' },
}

interface CheckpointListProps {
  journalId: string
  checkpoints: Checkpoint[]
}

/** Only the open checkpoint is an action: its whole card leads to a new update. The others are plain information. */
export function CheckpointList({ journalId, checkpoints }: CheckpointListProps) {
  return (
    <ol className={styles.list} aria-label="Checkpoints">
      {checkpoints.map((checkpoint) => {
        const state = states[checkpoint.state]
        return (
          <li key={checkpoint.number} className={`${styles.item} ${styles[checkpoint.state]}`}>
            <span className={styles.marker}>
              <Icon name={state.icon} size={22} />
            </span>
            <div className={styles.body}>
              <strong>Checkpoint {checkpoint.number}</strong>
              {checkpoint.state === 'open' && <span className={styles.openLabel}>Open now</span>}
              <p className={styles.dates}>
                {formatDate(checkpoint.opens_on)} to {formatDate(checkpoint.closes_on)}
              </p>
            </div>
            {checkpoint.state === 'open' ? (
              <Link
                to={`/journals/${journalId}/updates/new`}
                className={styles.action}
                aria-label={`Add update for checkpoint ${checkpoint.number}`}
              >
                Add update
              </Link>
            ) : (
              <span className={styles.state}>{state.label}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
