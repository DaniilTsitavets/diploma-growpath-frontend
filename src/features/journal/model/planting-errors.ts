import { ApiError } from '@/shared/api/api-error'
import { describeError } from '@/shared/api/messages'

/** A second date for a planting that is already saved is refused; the other errors use the shared wording. */
export function describePlantingError(error: unknown): string {
  if (error instanceof ApiError && error.code === 'planting-already-recorded') {
    return 'The planting is already saved with another date, and it cannot be changed. Reload the page to see it.'
  }
  return describeError(error)
}
