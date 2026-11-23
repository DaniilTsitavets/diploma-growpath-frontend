import {
  airSentence,
  flagSentence,
  intervalSentence,
  ownIntervalSentence,
  reliabilityLabel,
  statusSentence,
  type Watering,
} from '../model/watering'
import styles from './WateringPanel.module.css'

/** What the diagnosis says about watering: the verdict, the interval corridor, what weighs on it and what it assumed. */
export function WateringPanel({ watering }: { watering: Watering }) {
  const interval = intervalSentence(watering)
  const own = ownIntervalSentence(watering)
  const air = airSentence(watering)

  return (
    <section className={styles.panel} aria-labelledby="watering-assessment">
      <h3 id="watering-assessment">Watering</h3>
      <p className={styles.status}>{statusSentence[watering.status]}</p>
      {(interval || own) && (
        <ul className={styles.facts}>
          {interval && <li>{interval}</li>}
          {own && <li>{own}</li>}
        </ul>
      )}
      {watering.flags.length > 0 && (
        <ul className={styles.flags} aria-label="What affects watering">
          {watering.flags.map((flag) => (
            <li key={flag}>{flagSentence[flag]}</li>
          ))}
        </ul>
      )}
      <p className={styles.meta}>
        Reliability of this estimate: {reliabilityLabel[watering.reliability]}.
        {air && ` Air used: ${air}.`}
      </p>
      {watering.assumptions.length > 0 && (
        <details className={styles.details}>
          <summary>What this is based on</summary>
          <ul className={styles.assumptions}>
            {watering.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
