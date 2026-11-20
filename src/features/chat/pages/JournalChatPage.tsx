import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useJournal } from '@/features/journal/api/queries'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useChatHistory } from '../api/queries'
import type { ChatTurn } from '../model/types'
import { AskForm } from '../ui/AskForm'
import { ChatTurnView } from '../ui/ChatTurnView'
import styles from './JournalChatPage.module.css'

export function JournalChatPage() {
  const { journalId = '' } = useParams()
  const journal = useJournal(journalId)
  const history = useChatHistory(journalId)
  const [unsaved, setUnsaved] = useState<ChatTurn | null>(null)

  // The feed is newest first; a conversation reads oldest first.
  const turns = (history.data?.pages.flatMap((page) => page.items) ?? []).toReversed()

  return (
    <>
      <p>
        <Link to={journal.data ? `/journals/${journalId}` : '/chat'}>
          {journal.data ? 'Back to the journal' : 'All chats'}
        </Link>
      </p>
      <p className="eyebrow">AI chat</p>
      <h1>{journal.data ? `Ask about your ${journal.data.species}` : 'Ask about your plant'}</h1>

      <div className={styles.layout}>
        <AskForm
          journalId={journalId}
          onReply={(reply) => setUnsaved(reply.outcome === 'sources_only' ? reply : null)}
        />

        {history.isPending && (
          <div aria-busy="true">
            <p className="visually-hidden" role="status">
              Loading the conversation
            </p>
            <Skeleton height="5rem" />
          </div>
        )}
        {history.error && (
          <div role="alert">
            <p className={styles.error}>{describeError(history.error)}</p>
            <Button onClick={() => void history.refetch()}>Try again</Button>
          </div>
        )}
        {history.data && turns.length === 0 && (
          <p className={styles.empty}>No questions yet. Ask about watering, light or soil.</p>
        )}
        {(turns.length > 0 || unsaved) && (
          <section aria-label="Conversation" className={styles.history}>
            {history.hasNextPage && (
              <Button
                variant="secondary"
                onClick={() => void history.fetchNextPage()}
                disabled={history.isFetchingNextPage}
              >
                Show earlier questions
              </Button>
            )}
            {turns.map((turn) => (
              <ChatTurnView key={turn.id} turn={turn} />
            ))}
            {unsaved && <ChatTurnView turn={unsaved} />}
          </section>
        )}
      </div>
    </>
  )
}
