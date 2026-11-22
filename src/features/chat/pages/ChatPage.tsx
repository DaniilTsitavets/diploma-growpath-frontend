import { Link } from 'react-router'
import { useEntitlement } from '@/features/entitlement/api/use-entitlement'
import { remaining } from '@/features/entitlement/model/tiers'
import { useJournals } from '@/features/journal/api/queries'
import { formatDate } from '@/features/journal/model/dates'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './ChatPage.module.css'

function JournalPicker() {
  const journals = useJournals(false)

  if (journals.isPending) {
    return (
      <div aria-busy="true">
        <p className="visually-hidden" role="status">
          Loading your plants
        </p>
        <ul className={styles.list} aria-hidden="true">
          {[0, 1].map((index) => (
            <li key={index} className={styles.card}>
              <Skeleton height="heading" width={50} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (journals.error) {
    return (
      <div role="alert">
        <p className={styles.error}>{describeError(journals.error)}</p>
        <Button onClick={() => void journals.refetch()}>Try again</Button>
      </div>
    )
  }

  if (journals.data.length === 0) {
    return (
      <p>
        You have no journals yet. <Link to="/shop">Order a pack</Link> to start one.
      </p>
    )
  }

  return (
    <ul className={styles.list}>
      {journals.data.map((journal) => (
        <li key={journal.id} className={styles.card}>
          <span className={styles.icon}>
            <Icon name="chat" size={24} />
          </span>
          <div className={styles.body}>
            <h2>
              <Link to={`/journals/${journal.id}/chat`} className={styles.link}>
                {journal.species}
              </Link>
            </h2>
            <p className={styles.meta}>
              <Icon name="calendar" size={16} />
              {journal.planted_on
                ? `Planted on ${formatDate(journal.planted_on)}`
                : 'Not planted yet'}
            </p>
          </div>
          <Icon name="arrow" className={styles.arrow} />
        </li>
      ))}
    </ul>
  )
}

function AiChecksNote() {
  const entitlement = useEntitlement()
  const left = entitlement.data ? remaining(entitlement.data.ai_quota_today) : null
  return (
    <p className={styles.note}>
      <Icon name="alert" size={18} />
      <span>
        Each question uses one AI check.
        {left !== null && entitlement.data
          ? ` Left today: ${left} of ${entitlement.data.ai_quota_today.limit}.`
          : ''}
      </span>
    </p>
  )
}

export function ChatPage() {
  return (
    <>
      <p className="eyebrow">AI chat</p>
      <h1>Ask about your plants</h1>
      <p className={styles.lead}>
        Answers come from our care guides, with the sections they are based on. Pick the plant you
        mean, so the assistant knows which one to talk about.
      </p>
      <h2 className={styles.heading}>Choose a plant</h2>
      <JournalPicker />
      <AiChecksNote />
    </>
  )
}
