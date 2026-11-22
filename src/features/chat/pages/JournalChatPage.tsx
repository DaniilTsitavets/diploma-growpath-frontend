import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useJournal } from '@/features/journal/api/queries'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useChatHistory } from '../api/queries'
import type { ChatTurn } from '../model/types'
import { AskForm } from '../ui/AskForm'
import { AssistantAvatar } from '../ui/AssistantAvatar'
import { ChatTurnView } from '../ui/ChatTurnView'
import styles from './JournalChatPage.module.css'

export function JournalChatPage() {
  const { journalId = '' } = useParams()
  const journal = useJournal(journalId)
  const history = useChatHistory(journalId)
  const [unsaved, setUnsaved] = useState<ChatTurn | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const log = useRef<HTMLDivElement>(null)

  // The feed is newest first; a conversation reads oldest first.
  const turns = (history.data?.pages.flatMap((page) => page.items) ?? []).toReversed()
  const species = journal.data?.species

  useEffect(() => {
    const element = log.current
    if (element) element.scrollTop = element.scrollHeight
  }, [turns.length, unsaved, pending])

  return (
    <>
      <p>
        <Link to={journal.data ? `/journals/${journalId}` : '/chat'}>
          {journal.data ? 'Back to the journal' : 'All chats'}
        </Link>
      </p>
      <p className="eyebrow">AI chat</p>
      <h1>{species ? `Ask about your ${species}` : 'Ask about your plant'}</h1>

      <section className={styles.panel} aria-label="AI assistant">
        <header className={styles.head}>
          <AssistantAvatar className={styles.avatar} />
          <span className={styles.title}>GrowPath assistant</span>
        </header>

        <div
          ref={log}
          className={styles.log}
          role="log"
          aria-label="Conversation"
          aria-live="polite"
        >
          <div className={styles.row}>
            <AssistantAvatar className={styles.avatar} />
            <p className={styles.bubble}>
              Hi! Ask me anything about {species ? `your ${species}` : 'plant care'}. I answer from
              our care guides and show the sections I used.
            </p>
          </div>

          {history.isPending && (
            <div aria-busy="true">
              <p className="visually-hidden" role="status">
                Loading the conversation
              </p>
              <Skeleton height="block" />
            </div>
          )}
          {history.error && (
            <div role="alert">
              <p className={styles.error}>{describeError(history.error)}</p>
              <Button onClick={() => void history.refetch()}>Try again</Button>
            </div>
          )}
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
          {pending && (
            <>
              <p className={`${styles.bubble} ${styles.userBubble}`}>{pending}</p>
              <div className={styles.row}>
                <AssistantAvatar className={styles.avatar} />
                <p className={styles.bubble} role="status">
                  Looking it up…
                </p>
              </div>
            </>
          )}
        </div>

        <div className={styles.foot}>
          <AskForm
            journalId={journalId}
            onReply={(reply) => setUnsaved(reply.outcome === 'sources_only' ? reply : null)}
            onPending={setPending}
          />
        </div>
      </section>
    </>
  )
}
