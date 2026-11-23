import { ApiError } from '@/shared/api/api-error'
import { describeError } from '@/shared/api/messages'

const MESSAGES: Record<string, string> = {
  'user-exists': 'A user with this email already exists.',
  'invalid-password':
    'The password does not meet the password policy. Try a longer or more varied one.',
  'user-not-found': 'This user no longer exists. The list has been refreshed.',
  'cannot-modify-self': 'You cannot change your own account.',
}

/** Wording for the codes the admin operations return; anything else uses the shared wording. */
export function describeAdminError(error: unknown): string {
  const known = error instanceof ApiError && error.code ? MESSAGES[error.code] : undefined
  return known ?? describeError(error)
}
