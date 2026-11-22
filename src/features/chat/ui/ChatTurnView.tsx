import { safeHttpUrl } from '../model/safe-url'
import type { ChatOutcome, ChatSource, ChatTurn, RelatedSection } from '../model/types'
import { AssistantAvatar } from './AssistantAvatar'
import styles from './ChatTurnView.module.css'

const notices: Record<Exclude<ChatOutcome, 'answered'>, string> = {
  not_in_kb: 'The care knowledge base has nothing on this question, so there is no answer to give.',
  out_of_scope: 'This question is not about plant care, so the chat cannot answer it.',
  sources_only:
    'The AI could not answer right now. Here are the sections that match. Nothing was charged, and you can send the same question again.',
}

function SourceChip({ source }: { source: ChatSource }) {
  const href = safeHttpUrl(source.source_url)
  const text = `${source.document_title}: ${source.section_heading}`
  return href ? (
    <a className={styles.source} href={href} target="_blank" rel="noopener noreferrer">
      {text}
    </a>
  ) : (
    <span className={styles.source}>{text}</span>
  )
}

function RelatedSections({ sections }: { sections: RelatedSection[] }) {
  return (
    <ul className={styles.related} aria-label="Matching sections">
      {sections.map((section) => (
        <li key={section.section_id}>
          <details>
            <summary>
              {section.document_title}: {section.section_heading}
            </summary>
            <p>{section.body}</p>
          </details>
        </li>
      ))}
    </ul>
  )
}

/** One exchange: the user's question on the right, the assistant's reply with its sources on the left. */
export function ChatTurnView({ turn }: { turn: ChatTurn }) {
  return (
    <article className={styles.turn}>
      <div className={`${styles.row} ${styles.user}`}>
        <p className={`${styles.bubble} ${styles.userBubble} ${styles.text}`}>{turn.question}</p>
      </div>
      <div className={styles.row}>
        <AssistantAvatar className={styles.avatar} />
        <div className={styles.bubble}>
          {turn.outcome === 'answered' && turn.answer ? (
            <p className={styles.text}>{turn.answer}</p>
          ) : (
            turn.outcome !== 'answered' && <p className={styles.notice}>{notices[turn.outcome]}</p>
          )}
          {turn.sources.length > 0 && (
            <div>
              <p className={styles.sourcesTitle}>Sources</p>
              <ul className={styles.sources}>
                {turn.sources.map((source) => (
                  <li key={source.section_id}>
                    <SourceChip source={source} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {turn.outcome === 'sources_only' && turn.related.length > 0 && (
            <RelatedSections sections={turn.related} />
          )}
        </div>
      </div>
    </article>
  )
}
