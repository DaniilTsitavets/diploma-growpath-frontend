import { ApiError, networkApiError } from '@/shared/api/api-error'
import type { PhotoKind } from '../model/types'
import { confirmPhoto, requestPhotoUpload } from './journal-api'

/**
 * The browser sets these itself from the body; sending them by hand is not allowed and would not change anything,
 * because the signed link only accepts the type and the size that were declared.
 */
const SET_BY_BROWSER = new Set(['content-length'])

/**
 * Uploads one photo in the three steps the backend needs: ask for a link that signs the declared type and size,
 * send the file to it with exactly the headers the link requires, and confirm. Until it is confirmed the photo
 * does not count as uploaded.
 */
export async function uploadPhoto(updateId: string, kind: PhotoKind, file: File): Promise<void> {
  const ticket = await requestPhotoUpload(updateId, kind, file)

  const headers = Object.fromEntries(
    Object.entries(ticket.required_headers).filter(
      ([name]) => !SET_BY_BROWSER.has(name.toLowerCase()),
    ),
  )
  let response: Response
  try {
    response = await fetch(ticket.upload_url, { method: 'PUT', headers, body: file })
  } catch (cause) {
    throw networkApiError(cause)
  }

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      title: 'Photo upload failed',
      detail:
        response.status === 403
          ? 'The upload link expired. Choose the photo again.'
          : 'The photo could not be uploaded. Try again.',
    })
  }

  await confirmPhoto(updateId, kind)
}
