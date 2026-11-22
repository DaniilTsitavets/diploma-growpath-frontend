import { Link } from 'react-router'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useTicketQueue } from '../api/queries'
import { isUrgent, timeLeft } from '../model/deadline'
import styles from './TicketsPage.module.css'

function formatCreated(iso: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

export function TicketsPage() {
  const queue = useTicketQueue()
  const now = queue.dataUpdatedAt
  const tickets = queue.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <>
      <p className="eyebrow">Expert view</p>
      <h1>Open tickets</h1>
      <p className={styles.meta}>The ticket that expires soonest comes first.</p>

      {queue.isPending && (
        <div aria-busy="true">
          <p className="visually-hidden" role="status">
            Loading the tickets
          </p>
          <Skeleton height="block" />
        </div>
      )}
      {queue.error && (
        <div role="alert">
          <p className={styles.error}>{describeError(queue.error)}</p>
          <Button onClick={() => void queue.refetch()}>Try again</Button>
        </div>
      )}
      {queue.data && tickets.length === 0 && (
        <p className={styles.empty}>No open tickets. New questions from users appear here.</p>
      )}
      {tickets.length > 0 && (
        <ul className={styles.list} aria-label="Open tickets">
          {tickets.map((ticket) => {
            const left = timeLeft(ticket.expires_at, now)
            const urgent = isUrgent(ticket.expires_at, now)
            return (
              <li key={ticket.id} className={styles.row}>
                <div>
                  <Link to={`/expert/tickets/${ticket.id}`} className={styles.species}>
                    {ticket.species ?? 'Unknown plant'}
                  </Link>
                  <p className={styles.meta}>Asked {formatCreated(ticket.created_at)}</p>
                </div>
                <span className={`${styles.left} ${urgent ? styles.urgent : ''}`}>
                  {left === 'expired' ? 'Expired' : `${left} left`}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {queue.hasNextPage && (
        <p>
          <Button
            variant="secondary"
            onClick={() => void queue.fetchNextPage()}
            disabled={queue.isFetchingNextPage}
          >
            Show more tickets
          </Button>
        </p>
      )}
    </>
  )
}
