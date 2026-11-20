import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { isAiQuotaExhausted } from '@/features/diagnosis/model/errors'
import { useEntitlement } from '@/features/entitlement/api/use-entitlement'
import { remaining, upgradeHint } from '@/features/entitlement/model/tiers'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { TextAreaField } from '@/shared/ui/TextAreaField'
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
}

export function AskForm({ journalId, onReply }: AskFormProps) {
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

  const onSubmit = (values: ChatQuestionValues) =>
    ask.mutate(values.question, {
      onSuccess: (turn) => {
        onReply(turn)
        if (turn.outcome !== 'sources_only') reset({ question: '' })
      },
    })

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
    >
      <TextAreaField
        id="chat-question"
        label="Your question"
        maxLength={CHAT_QUESTION_LIMIT}
        error={errors.question?.message}
        {...register('question')}
      />
      {quota && (
        <p className={styles.note}>
          Each question uses one AI check. Left today: {remaining(quota)} of {quota.limit}.
        </p>
      )}
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
      <Button type="submit" disabled={ask.isPending}>
        {ask.isPending ? 'Looking it up…' : 'Ask'}
      </Button>
    </form>
  )
}
