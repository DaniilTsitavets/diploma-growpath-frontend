import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { TextAreaField } from '@/shared/ui/TextAreaField'
import { useAnswerTicket } from '../api/queries'
import { ANSWER_LIMIT, answerSchema, type AnswerValues } from '../model/answer-schema'
import { describeAnswerError } from '../model/errors'
import styles from './AnswerForm.module.css'

export function AnswerForm({ ticketId }: { ticketId: string }) {
  const answer = useAnswerTicket(ticketId)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnswerValues>({ resolver: zodResolver(answerSchema), defaultValues: { body: '' } })

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => void handleSubmit((values) => answer.mutate(values.body))(event)}
    >
      <TextAreaField
        id="expert-answer"
        label="Your written answer"
        hint="One answer per ticket. It is sent to the user and cannot be edited."
        maxLength={ANSWER_LIMIT}
        rows={8}
        error={errors.body?.message}
        {...register('body')}
      />
      {answer.error && (
        <p role="alert" className={styles.error}>
          {describeAnswerError(answer.error) ?? describeError(answer.error)}
        </p>
      )}
      <Button type="submit" disabled={answer.isPending}>
        {answer.isPending ? 'Sending…' : 'Send answer'}
      </Button>
    </form>
  )
}
