import {
  drainageLabels,
  fingerTestLabels,
  lightingLabels,
  potWeightLabels,
} from '@/features/journal/model/labels'
import { formatDate } from '@/features/journal/model/dates'
import { humanize, type TicketContext } from '../model/ticket-context'
import styles from './TicketContextView.module.css'

const statusLabels: Record<string, string> = {
  completed: 'Diagnosed',
  awaiting_clarification: 'Waiting for the user',
  degraded: 'AI unavailable',
  diagnosis_pending: 'Not run yet',
}

function isoDay(value: string | undefined) {
  return value ? formatDate(value.slice(0, 10)) : 'Not given'
}

/** Blocks in the order an expert needs them: the question, the AI's view, the answers, then the history. */
export function TicketContextView({ context }: { context: TicketContext }) {
  const { update, diagnosis, clarification, history } = context
  return (
    <>
      {!context.supported && (
        <p className={styles.warning} role="note">
          This ticket uses a newer data format than this page knows. The parts that are recognised
          are shown below; some details may be missing.
        </p>
      )}

      {context.userQuestion && (
        <section className={styles.block} aria-labelledby="ctx-question">
          <h2 id="ctx-question">The user's question</h2>
          <p className={styles.quote}>{context.userQuestion}</p>
        </section>
      )}

      {diagnosis && (
        <section className={styles.block} aria-labelledby="ctx-diagnosis">
          <h2 id="ctx-diagnosis">What the AI found</h2>
          {diagnosis.status && (
            <p className={styles.note}>{humanize(statusLabels, diagnosis.status)}</p>
          )}
          {diagnosis.candidates.length > 0 ? (
            <ol className={styles.causes} aria-label="Possible causes, most likely first">
              {diagnosis.candidates.map((candidate) => (
                <li key={candidate.rank}>
                  <div>
                    <strong>{candidate.cause}</strong>
                    <p>{candidate.rationale}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.note}>The AI did not rank any causes.</p>
          )}
          {diagnosis.recommendation && <p className={styles.quote}>{diagnosis.recommendation}</p>}
          {clarification && (
            <dl className={styles.facts}>
              <dt>AI asked</dt>
              <dd>{clarification.question}</dd>
              <dt>User replied</dt>
              <dd>{clarification.answer ?? 'No reply'}</dd>
            </dl>
          )}
        </section>
      )}

      {update && (
        <section className={styles.block} aria-labelledby="ctx-answers">
          <h2 id="ctx-answers">The user's answers</h2>
          <dl className={styles.facts}>
            <dt>Sent</dt>
            <dd>{isoDay(update.created_at)}</dd>
            <dt>Last watered</dt>
            <dd>{isoDay(update.last_watered_on)}</dd>
            <dt>Watering interval</dt>
            <dd>
              {update.watering_interval_days
                ? `${update.watering_interval_days} days`
                : 'Not given'}
            </dd>
            <dt>Drainage</dt>
            <dd>{humanize(drainageLabels, update.drainage)}</dd>
            <dt>Lighting</dt>
            <dd>{humanize(lightingLabels, update.lighting)}</dd>
            <dt>Soil by finger test</dt>
            <dd>{humanize(fingerTestLabels, update.finger_test)}</dd>
            <dt>Pot weight</dt>
            <dd>{humanize(potWeightLabels, update.pot_weight)}</dd>
            <dt>Sensor reading</dt>
            <dd>{update.sensor_reading ?? 'Not given'}</dd>
          </dl>
        </section>
      )}

      {history.length > 0 && (
        <section className={styles.block} aria-labelledby="ctx-history">
          <h2 id="ctx-history">Earlier updates</h2>
          <ul className={styles.history}>
            {history.map((entry) => (
              <li key={entry.date + (entry.top_cause ?? '')}>
                {formatDate(entry.date)}:{' '}
                {entry.top_cause ?? humanize(statusLabels, entry.diagnosis_status)}
              </li>
            ))}
          </ul>
          <p className={styles.note}>The oldest entries may be left out of long histories.</p>
        </section>
      )}
    </>
  )
}
