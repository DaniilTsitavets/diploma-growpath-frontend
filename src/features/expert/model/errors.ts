import { ApiError } from '@/shared/api/api-error'

/** Messages for the 409 answers of the answer operation; other errors use the shared wording. */
export function describeAnswerError(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.kind !== 'conflict') return null
  if (error.code === 'ticket-already-answered')
    return 'Another expert already answered this ticket.'
  if (error.code === 'ticket-expired') return 'This ticket expired before it was answered.'
  return null
}
