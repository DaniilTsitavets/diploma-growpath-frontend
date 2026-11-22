import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { isAiQuotaExhausted } from '@/features/diagnosis/model/errors'
import { useEntitlement } from '@/features/entitlement/api/use-entitlement'
import { remaining, upgradeHint } from '@/features/entitlement/model/tiers'
import { describeError } from '@/shared/api/messages'
import { useAskQuestion } from '../api/queries'
import {
  CHAT_QUESTION_LIMIT,
  chatQuestionSchema,
  type ChatQuestionValues,
} from '../model/question-schema'
import type { ChatTurn } from '../model/types'
import styles from './AskForm.module.css'

interface AskFormProps {
  journalId: string
  onReply: (turn: ChatTurn) => void
  /** The question being answered, or null once it is settled; lets the page show a waiting bubble. */
  onPending: (question: string | null) => void
}

export function AskForm({ journalId, onReply, onPending }: AskFormProps) {
  const ask = useAskQuestion(journalId)
  const entitlement = useEntitlement()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChatQuestionValues>({
    resolver: zodResolver(chatQuestionSchema),
    defaultValues: { question: '' },
  })

  const quota = entitlement.data?.ai_quota_today
  const exhausted = isAiQuotaExhausted(ask.error)

  const submit = handleSubmit((values) => {
    onPending(values.question)
    ask.mutate(values.question, {
      onSuccess: (turn) => {
        onReply(turn)
        if (turn.outcome !== 'sources_only') reset({ question: '' })
      },
      onSettled: () => onPending(null),
    })
  })

  return (
    <form className={styles.form} noValidate onSubmit={(event) => void submit(event)}>
      <div className={styles.composer}>
        <label htmlFor="chat-question" className="visually-hidden">
          Your question
        </label>
        <textarea
          id="chat-question"
          className={styles.input}
          rows={1}
          maxLength={CHAT_QUESTION_LIMIT}
          placeholder="Ask about care, or describe the problem…"
          aria-invalid={errors.question ? 'true' : undefined}
          aria-describedby="chat-note"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void submit()
            }
          }}
          {...register('question')}
        />
        <button
          type="submit"
          className={styles.send}
          disabled={ask.isPending}
          aria-label="Send question"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 19V5m0 0-6 6m6-6 6 6" />
          </svg>
        </button>
      </div>
      {errors.question && <p className={styles.error}>{errors.question.message}</p>}
      {ask.error && (
        <div role="alert" className={styles.error}>
          <p>
            {exhausted
              ? 'Your AI checks for today are used up, so the question was not sent.'
              : describeError(ask.error)}
          </p>
          {exhausted && entitlement.data && upgradeHint(entitlement.data.tier) && (
            <p>{upgradeHint(entitlement.data.tier)}</p>
          )}
        </div>
      )}
      <p id="chat-note" className={styles.note}>
        {quota
          ? `Each question uses one AI check. Left today: ${remaining(quota)} of ${quota.limit}. `
          : ''}
        The assistant can make mistakes, so check care details against the sources.
      </p>
    </form>
  )
}
