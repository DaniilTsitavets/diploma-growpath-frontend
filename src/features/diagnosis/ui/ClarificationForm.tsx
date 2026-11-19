import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { useAnswerClarification } from '../api/queries'
import {
  CLARIFICATION_LIMIT,
  clarificationSchema,
  type ClarificationValues,
} from '../model/clarification-schema'
import styles from './DiagnosisPanel.module.css'

interface ClarificationFormProps {
  updateId: string
  journalId: string
  question: string
}

export function ClarificationForm({ updateId, journalId, question }: ClarificationFormProps) {
  const answer = useAnswerClarification(updateId, journalId)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClarificationValues>({ resolver: zodResolver(clarificationSchema) })

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => void handleSubmit((values) => answer.mutate(values.answer))(event)}
    >
      <label htmlFor="clarification-answer">{question}</label>
      <textarea
        id="clarification-answer"
        className={styles.textarea}
        maxLength={CLARIFICATION_LIMIT}
        aria-invalid={errors.answer ? 'true' : undefined}
        aria-describedby={errors.answer ? 'clarification-error' : 'clarification-note'}
        {...register('answer')}
      />
      {errors.answer ? (
        <p id="clarification-error" className={styles.error}>
          {errors.answer.message}
        </p>
      ) : (
        <p id="clarification-note" className={styles.note}>
          Answering is free and does not use an AI check.
        </p>
      )}
      {answer.error && (
        <p role="alert" className={styles.error}>
          {describeError(answer.error)}
        </p>
      )}
      <Button type="submit" disabled={answer.isPending}>
        {answer.isPending ? 'Checking your plant…' : 'Send answer'}
      </Button>
    </form>
  )
}
