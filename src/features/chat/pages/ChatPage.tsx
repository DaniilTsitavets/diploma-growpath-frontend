import { Link } from 'react-router'
import { useJournals } from '@/features/journal/api/queries'
import { Card } from '@/shared/ui/Card'
import styles from './ChatPage.module.css'

function JournalPicker() {
  const journals = useJournals(false)
  return (
    <Card className={styles.panel}>
      <h2>Ask about one of your plants</h2>
      {journals.data && journals.data.length > 0 ? (
        <ul className={styles.journals}>
          {journals.data.map((journal) => (
            <li key={journal.id}>
              <Link to={`/journals/${journal.id}/chat`}>{journal.species}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          You have no journals yet. <Link to="/shop">Order a pack</Link> to start one.
        </p>
      )}
    </Card>
  )
}

export function ChatPage() {
  return (
    <>
      <p className="eyebrow">AI chat</p>
      <h1>Ask about your plants</h1>
      <p className={styles.lead}>
        Get an answer from our care knowledge base, with the sections it came from. The chat belongs
        to a journal, so it knows which plant you mean.
      </p>
      <JournalPicker />
      <p className={styles.note}>Each question uses one AI check from your daily limit.</p>
    </>
  )
}
