import { Icon, type IconName } from '@/shared/ui/Icon'
import { formatDate } from '../model/dates'
import type { Checkpoint } from '../model/types'
import styles from './CheckpointList.module.css'

const states: Record<Checkpoint['state'], { label: string; icon: IconName }> = {
  upcoming: { label: 'Upcoming', icon: 'clock' },
  open: { label: 'Open now', icon: 'dot' },
  passed: { label: 'Passed', icon: 'check' },
}

export function CheckpointList({ checkpoints }: { checkpoints: Checkpoint[] }) {
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
              <p className={styles.dates}>
                {formatDate(checkpoint.opens_on)} to {formatDate(checkpoint.closes_on)}
              </p>
            </div>
            <span className={styles.state}>{state.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
