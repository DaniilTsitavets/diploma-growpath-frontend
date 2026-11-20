import { safeHttpUrl } from '../model/safe-url'
import type { ChatOutcome, ChatSource, ChatTurn, RelatedSection } from '../model/types'
import styles from './ChatTurnView.module.css'

const notices: Record<Exclude<ChatOutcome, 'answered'>, string> = {
  not_in_kb: 'The care knowledge base has nothing on this question, so there is no answer to give.',
  out_of_scope: 'This question is not about plant care, so the chat cannot answer it.',
  sources_only:
    'The AI could not answer right now. Here are the sections that match. Nothing was charged, and you can send the same question again.',
}

function SourceLink({ source }: { source: ChatSource }) {
  const href = safeHttpUrl(source.source_url)
  const text = `${source.document_title}: ${source.section_heading}`
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {text}
    </a>
  ) : (
    <span>{text}</span>
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

/** A `sources_only` reply is not stored: it carries the matching sections itself and is shown once. */
export function ChatTurnView({ turn }: { turn: ChatTurn }) {
  const sections = turn.related
  return (
    <article className={styles.turn}>
      <p className={styles.question}>{turn.question}</p>
      {turn.outcome === 'answered' && turn.answer ? (
        <p className={styles.answer}>{turn.answer}</p>
      ) : (
        turn.outcome !== 'answered' && <p className={styles.notice}>{notices[turn.outcome]}</p>
      )}
      {turn.sources.length > 0 && (
        <div>
          <p className={styles.sourcesTitle}>Sources</p>
          <ol className={styles.sources}>
            {turn.sources.map((source) => (
              <li key={source.section_id}>
                <SourceLink source={source} />
              </li>
            ))}
          </ol>
        </div>
      )}
      {turn.outcome === 'sources_only' && sections.length > 0 && (
        <RelatedSections sections={sections} />
      )}
    </article>
  )
}
