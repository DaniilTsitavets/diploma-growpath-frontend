import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useJournals } from '../api/queries'
import { formatDate } from '../model/dates'
import styles from './JournalsPage.module.css'

const POLL_WINDOW_MS = 60_000

/** After an order the journal draft appears asynchronously, so an empty list is polled for a minute. */
function usePollWindow() {
  const [open, setOpen] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), POLL_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [])
  return open
}

export function JournalsPage() {
  const polling = usePollWindow()
  const { data, isPending, error, refetch, isFetching } = useJournals(polling)

  return (
    <>
      <h1>Journals</h1>
      {isPending && (
        <div aria-busy="true">
          <p className="visually-hidden" role="status">
            Loading your journals
          </p>
          <ul className={styles.list} aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <li key={index} className={styles.card}>
                <Skeleton height="heading" width={50} />
                <Skeleton width={70} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <div role="alert">
          <p className={styles.error}>{describeError(error)}</p>
          <Button onClick={() => void refetch()} disabled={isFetching}>
            Try again
          </Button>
        </div>
      )}
      {data?.length === 0 && (
        <p role="status">
          {polling
            ? 'Waiting for your journal. It appears a few seconds after you order a pack.'
            : 'You have no journals yet.'}{' '}
          <Link to="/shop">Browse the shop</Link>
        </p>
      )}
      {data && data.length > 0 && (
        <ul className={styles.list}>
          {data.map((journal) => (
            <li key={journal.id} className={styles.card}>
              <h2>
                <Link to={`/journals/${journal.id}`}>{journal.species}</Link>
              </h2>
              <p className={styles.meta}>
                {journal.planted_on
                  ? `Planted on ${formatDate(journal.planted_on)}`
                  : 'Not planted yet'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
