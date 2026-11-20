import { Link, useParams } from 'react-router'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useJournal, useUpdates } from '../api/queries'
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
        <Skeleton height="2rem" width="40%" />
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
      <h1>{journal.data.species}</h1>

      <section className={styles.section} aria-labelledby="planting-title">
        <h2 id="planting-title">Planting</h2>
        <PlantingForm journalId={journalId} plantedOn={journal.data.planted_on} />
      </section>

      <section className={styles.section} aria-labelledby="checkpoints-title">
        <h2 id="checkpoints-title">Checkpoints</h2>
        {journal.data.checkpoints.length === 0 ? (
          <p>Checkpoints appear after you record the planting date.</p>
        ) : (
          <CheckpointList checkpoints={journal.data.checkpoints} />
        )}
      </section>

      <section className={styles.section} aria-labelledby="chat-title">
        <div className={styles.heading}>
          <h2 id="chat-title">Care chat</h2>
          <Link to={`/journals/${journalId}/chat`}>Ask a care question</Link>
        </div>
        <p>Answers come from the care knowledge base, with the sections they are based on.</p>
      </section>

      <section className={styles.section} aria-labelledby="updates-title">
        <div className={styles.heading}>
          <h2 id="updates-title">Updates</h2>
          <Link to={`/journals/${journalId}/updates/new`}>Add an update</Link>
        </div>
        {updates.isPending && <Skeleton height="3rem" />}
        {updates.error && (
          <div role="alert">
            <p className={styles.error}>{describeError(updates.error)}</p>
            <Button onClick={() => void updates.refetch()}>Try again</Button>
          </div>
        )}
        {updates.data && updates.data.items.length === 0 && <p>No updates yet.</p>}
        {updates.data && updates.data.items.length > 0 && (
          <UpdateList journalId={journalId} updates={updates.data.items} />
        )}
      </section>
    </>
  )
}
