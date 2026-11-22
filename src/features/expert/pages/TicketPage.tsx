import { Link, useParams } from 'react-router'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useTicket } from '../api/queries'
import { timeLeft } from '../model/deadline'
import { parseTicketContext } from '../model/ticket-context'
import { AnswerForm } from '../ui/AnswerForm'
import { TicketContextView } from '../ui/TicketContextView'
import styles from './TicketPage.module.css'

const photoLabels: Record<string, string> = {
  overview: 'Whole plant',
  soil: 'Soil',
  symptom_closeup: 'Symptom close-up',
  roots_drainage: 'Roots and drainage',
}

export function TicketPage() {
  const { ticketId = '' } = useParams()
  const ticket = useTicket(ticketId)

  if (ticket.isPending) {
    return (
      <div aria-busy="true">
        <p className="visually-hidden" role="status">
          Loading the ticket
        </p>
        <Skeleton height="title" width={40} />
      </div>
    )
  }
  if (ticket.error) {
    return (
      <div role="alert">
        <p className={styles.error}>{describeError(ticket.error)}</p>
        <Button onClick={() => void ticket.refetch()}>Try again</Button>
        <p>
          <Link to="/expert/tickets">Back to the tickets</Link>
        </p>
      </div>
    )
  }

  const data = ticket.data
  const context = parseTicketContext(data.context)
  const open = data.status === 'open' && timeLeft(data.expires_at) !== 'expired'

  return (
    <>
      <p>
        <Link to="/expert/tickets">All tickets</Link>
      </p>
      <p className="eyebrow">Ticket</p>
      <h1>{context.species ?? 'Unknown plant'}</h1>
      <p className={styles.status}>
        {data.status === 'answered' && 'Answered'}
        {data.status === 'cancelled' && 'Expired without an answer'}
        {data.status === 'open' &&
          (open
            ? `Open, ${timeLeft(data.expires_at)} left`
            : 'Expired, it can no longer be answered')}
      </p>

      <div className={styles.layout}>
        <div className={styles.main}>
          <TicketContextView context={context} />

          <section aria-labelledby="answer-title">
            <h2 id="answer-title">Answer</h2>
            {data.status === 'answered' && data.answer_text ? (
              <p className={styles.answer}>{data.answer_text}</p>
            ) : open ? (
              <AnswerForm ticketId={ticketId} />
            ) : (
              <p className={styles.status}>This ticket can no longer be answered.</p>
            )}
          </section>
        </div>

        <aside aria-labelledby="photos-title">
          <h2 id="photos-title">Photos</h2>
          {data.photos.length === 0 ? (
            <p className={styles.status}>No photos.</p>
          ) : (
            <ul className={styles.photos}>
              {data.photos.map((photo) => (
                <li key={photo.kind}>
                  <figure>
                    <img
                      src={photo.url}
                      alt={`${photoLabels[photo.kind] ?? photo.kind} photo from the user`}
                      loading="lazy"
                    />
                    <figcaption>{photoLabels[photo.kind] ?? photo.kind}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </>
  )
}
