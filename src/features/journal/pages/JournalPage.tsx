import { Link, useParams } from 'react-router'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useJournal, useUpdates } from '../api/queries'
import { formatDate } from '../model/dates'
import { ActionLink } from '../ui/ActionLink'
import { CheckpointList } from '../ui/CheckpointList'
import { PlantingForm } from '../ui/PlantingForm'
import { UpdateList } from '../ui/UpdateList'
import styles from './JournalPage.module.css'

export function JournalPage() {
  const { journalId = '' } = useParams()
  const journal = useJournal(journalId)
  const updates = useUpdates(journalId)

  if (journal.isPending) {
    return (
      <div aria-busy="true">
        <p className="visually-hidden" role="status">
          Loading the journal
        </p>
        <Skeleton height="title" width={40} />
      </div>
    )
  }

  if (journal.error) {
    return (
      <div role="alert">
        <p className={styles.error}>{describeError(journal.error)}</p>
        <Button onClick={() => void journal.refetch()}>Try again</Button>
        <p>
          <Link to="/journals">Back to journals</Link>
        </p>
      </div>
    )
  }

  return (
    <>
      <p>
        <Link to="/journals">All journals</Link>
      </p>
      <p className="eyebrow">Plant journal</p>
      <h1>{journal.data.species}</h1>
      <p className={styles.meta}>
        <Icon name="calendar" size={18} />
        {journal.data.planted_on
          ? `Planted on ${formatDate(journal.data.planted_on)}`
          : 'Not planted yet: record the planting date below'}
      </p>

      <div className={styles.actions}>
        <ActionLink
          to={`/journals/${journalId}/updates/new`}
          icon="camera"
          title="Add an update"
          description="Photos and a short questionnaire; the AI looks for the cause of a problem"
        />
        <ActionLink
          to={`/journals/${journalId}/chat`}
          icon="chat"
          title="Ask a care question"
          description="Answers come from the care guides, with the sections they are based on"
        />
      </div>

      <section className={styles.section} aria-labelledby="planting-title">
        <h2 id="planting-title">Planting</h2>
        <PlantingForm journalId={journalId} plantedOn={journal.data.planted_on} />
      </section>

      <section className={styles.section} aria-labelledby="checkpoints-title">
        <h2 id="checkpoints-title">Checkpoints</h2>
        {journal.data.checkpoints.length === 0 ? (
          <p>Checkpoints appear after you record the planting date.</p>
        ) : (
          <CheckpointList journalId={journalId} checkpoints={journal.data.checkpoints} />
        )}
      </section>

      <section className={styles.section} aria-labelledby="updates-title">
        <h2 id="updates-title">Updates</h2>
        {updates.isPending && <Skeleton height="row" />}
        {updates.error && (
          <div role="alert">
            <p className={styles.error}>{describeError(updates.error)}</p>
            <Button onClick={() => void updates.refetch()}>Try again</Button>
          </div>
        )}
        {updates.data && updates.data.items.length === 0 && (
          <p>No updates yet. Add the first one to get a diagnosis.</p>
        )}
        {updates.data && updates.data.items.length > 0 && (
          <UpdateList journalId={journalId} updates={updates.data.items} />
        )}
      </section>
    </>
  )
}
