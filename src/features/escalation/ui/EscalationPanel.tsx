import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDeclineEscalation, useDiagnosis } from '@/features/diagnosis/api/queries'
import { isExpertQuotaExhausted } from '@/features/diagnosis/model/errors'
import { useEntitlement } from '@/features/entitlement/api/use-entitlement'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useEscalation, useRequestEscalation } from '../api/queries'
import { expertAvailability } from '../model/availability'
import { QUESTION_LIMIT, questionSchema, type QuestionValues } from '../model/question-schema'
import styles from './EscalationPanel.module.css'

interface EscalationPanelProps {
  updateId: string
  journalId: string
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

export function EscalationPanel({ updateId, journalId }: EscalationPanelProps) {
  const escalation = useEscalation(updateId)
  const diagnosis = useDiagnosis(updateId)
  const entitlement = useEntitlement()
  const request = useRequestEscalation(updateId)
  const decline = useDeclineEscalation(updateId, journalId)
  const [pendingQuestion, setPendingQuestion] = useState<string | null | undefined>(undefined)

  const offered = Boolean(diagnosis.data?.escalation_offered && !diagnosis.data.escalation_declined)
  const declined = Boolean(diagnosis.data?.escalation_declined)
  const resolver = useMemo(() => zodResolver(questionSchema(!offered)), [offered])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuestionValues>({ resolver, defaultValues: { question: '' } })

  if (escalation.isPending || diagnosis.isPending) return <Skeleton height="block" />
  if (escalation.error) {
    return (
      <div role="alert">
        <p className={styles.error}>{describeError(escalation.error)}</p>
        <Button onClick={() => void escalation.refetch()}>Try again</Button>
      </div>
    )
  }

  const current = escalation.data
  if (current?.status === 'requested' || current?.status === 'ticket_open') {
    return (
      <div className={styles.panel}>
        <p role="status">
          Your question is with an expert. The written answer will appear here. A request that stays
          unanswered for 72 hours expires.
        </p>
        {current.user_question && (
          <p className={styles.note}>Your question: {current.user_question}</p>
        )}
      </div>
    )
  }
  if (current?.status === 'answered' && current.answer_text) {
    return (
      <div className={styles.panel}>
        <p className={styles.note}>
          Expert answer{current.answered_at ? `, ${formatWhen(current.answered_at)}` : ''}:
        </p>
        <p className={styles.answer}>{current.answer_text}</p>
      </div>
    )
  }

  const availability = entitlement.data ? expertAvailability(entitlement.data) : null
  const quotaError = isExpertQuotaExhausted(request.error)

  return (
    <div className={styles.panel}>
      {current?.status === 'cancelled' && (
        <p role="status">
          The last request expired without an answer, and the consultation was returned to you.
        </p>
      )}
      {offered && <p>The AI suggests asking an expert. The decision is yours.</p>}
      {declined && (
        <p className={styles.note}>You chose not to ask an expert for this diagnosis.</p>
      )}

      <form
        className={styles.form}
        noValidate
        onSubmit={(event) =>
          void handleSubmit((values) => setPendingQuestion(values.question.trim() || null))(event)
        }
      >
        <label htmlFor="expert-question">
          {offered ? 'Your question for the expert (optional)' : 'Your question for the expert'}
        </label>
        <textarea
          id="expert-question"
          className={styles.textarea}
          maxLength={QUESTION_LIMIT}
          aria-invalid={errors.question ? 'true' : undefined}
          aria-describedby={errors.question ? 'expert-question-error' : undefined}
          {...register('question')}
        />
        {errors.question && (
          <p id="expert-question-error" className={styles.error}>
            {errors.question.message}
          </p>
        )}
        {availability && (
          <p className={styles.note}>
            Expert consultations left: {availability.left} of {availability.limit}
          </p>
        )}
        {availability && !availability.available && (
          <p id="expert-unavailable" role="status">
            {availability.reason}
          </p>
        )}
        {request.error && (
          <p role="alert" className={styles.error}>
            {quotaExhaustedText(quotaError, request.error)}
          </p>
        )}
        {decline.error && (
          <p role="alert" className={styles.error}>
            {describeError(decline.error)}
          </p>
        )}
        <div className={styles.actions}>
          <Button
            type="submit"
            disabled={!availability?.available || request.isPending}
            aria-describedby={availability?.available === false ? 'expert-unavailable' : undefined}
          >
            Ask an expert
          </Button>
          {offered && (
            <Button
              variant="secondary"
              disabled={decline.isPending}
              onClick={() => decline.mutate()}
            >
              Don't ask an expert (free)
            </Button>
          )}
        </div>
      </form>

      {pendingQuestion !== undefined && availability?.available && (
        <ConfirmDialog
          title="Ask an expert?"
          confirmLabel="Send to the expert"
          pending={request.isPending}
          onClose={() => setPendingQuestion(undefined)}
          onConfirm={() =>
            request.mutate(pendingQuestion, { onSuccess: () => setPendingQuestion(undefined) })
          }
        >
          <p>
            This uses 1 of your {availability.limit} expert consultations ({availability.left} left)
            and cannot be cancelled. If nobody answers within 72 hours, the request expires and the
            consultation is returned.
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}

function quotaExhaustedText(exhausted: boolean, error: unknown) {
  return exhausted ? 'You have no expert consultations left.' : describeError(error)
}
