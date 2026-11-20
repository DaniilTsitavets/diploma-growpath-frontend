import { Link } from 'react-router'
import { useSession } from '@/features/auth/model/session-store'
import { useJournals } from '@/features/journal/api/queries'
import { Card } from '@/shared/ui/Card'
import styles from './ChatPage.module.css'

function SignInCard() {
  return (
    <Card className={styles.panel}>
      <h2>Sign in to ask a question</h2>
      <p>Anyone can read about how the chat works. Asking needs an account.</p>
      <Link to="/login" state={{ from: '/chat' }}>
        Sign in
      </Link>
    </Card>
  )
}

function JournalPicker() {
  const journals = useJournals(false)
  return (
    <Card className={styles.panel}>
      <h2>Ask about one of your plants</h2>
      {journals.data && journals.data.length > 0 ? (
        <ul className={styles.journals}>
          {journals.data.map((journal) => (
            <li key={journal.id}>
              <Link to={`/journals/${journal.id}`}>{journal.species}</Link>
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
  const session = useSession((state) => state.session)
  return (
    <>
      <p className="eyebrow">AI chat</p>
      <h1>Ask about your plants</h1>
      <p className={styles.lead}>
        Get an answer from our care knowledge base, with the sections it came from. The chat belongs
        to a journal, so it knows which plant you mean.
      </p>
      {session ? <JournalPicker /> : <SignInCard />}
      <p className={styles.note}>Each question uses one AI check from your daily limit.</p>
    </>
  )
}
