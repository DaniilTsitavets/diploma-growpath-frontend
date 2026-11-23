import { ApiError } from '@/shared/api/api-error'

const MESSAGES: Record<string, string> = {
  'photo-too-large': 'The photo is too large. Choose a smaller one.',
  'photo-type-not-allowed':
    'This photo type is not accepted. Use a JPEG, PNG or WebP photo (a phone photo in HEIC has to be saved as JPEG first).',
  'photo-not-uploaded': 'The photo did not reach the storage. Choose it again.',
  'roots-photo-not-requested': 'A roots photo is only taken when the diagnosis asks for it.',
}

/** Wording for the codes of the photo operations, or null so that the shared wording is used. */
export function describePhotoError(error: unknown): string | null {
  if (!(error instanceof ApiError) || !error.code) return null
  return MESSAGES[error.code] ?? null
}
