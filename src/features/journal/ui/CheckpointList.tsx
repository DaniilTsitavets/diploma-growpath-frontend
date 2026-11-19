import { formatDate } from '../model/dates'
import type { Checkpoint } from '../model/types'
import styles from './CheckpointList.module.css'

const stateLabels: Record<Checkpoint['state'], string> = {
  upcoming: 'Upcoming',
  open: 'Open now',
  passed: 'Passed',
}

export function CheckpointList({ checkpoints }: { checkpoints: Checkpoint[] }) {
  return (
    <ol className={styles.list} aria-label="Checkpoints">
      {checkpoints.map((checkpoint) => (
        <li
          key={checkpoint.number}
          className={`${styles.item} ${checkpoint.state === 'open' ? styles.open : ''}`}
        >
          <div>
            <strong>Checkpoint {checkpoint.number}</strong>
            <p className={styles.dates}>
              {formatDate(checkpoint.opens_on)} to {formatDate(checkpoint.closes_on)}
            </p>
          </div>
          <span className={styles.state}>{stateLabels[checkpoint.state]}</span>
        </li>
      ))}
    </ol>
  )
}
