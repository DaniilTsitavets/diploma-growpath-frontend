import { ApiError } from './api-error'

/** Maps any thrown value to a short message that is safe to show to the user. */
export function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something went wrong. Please try again.'
  switch (error.kind) {
    case 'network':
      return 'Cannot reach the server. Check your connection and try again.'
    case 'unauthorized':
      return 'Your session has expired. Please sign in again.'
    case 'forbidden':
      return 'You do not have access to this.'
    case 'not-found':
      return 'We could not find what you asked for.'
    case 'validation':
      return 'Some of the entered data is not valid.'
    case 'unavailable':
      return error.retryAfterSeconds
        ? `The service is temporarily unavailable. Try again in ${error.retryAfterSeconds} s.`
        : 'The service is temporarily unavailable. Try again shortly.'
    case 'conflict':
      return error.detail ?? 'This action conflicts with the current state.'
    case 'server':
      return 'The server failed to process the request. Please try again later.'
    default:
      return error.detail ?? 'The request failed.'
  }
}
