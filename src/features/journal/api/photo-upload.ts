import { ApiError, networkApiError } from '@/shared/api/api-error'
import type { PhotoKind } from '../model/types'
import { requestPhotoUpload } from './journal-api'

/** Asks the backend for a presigned URL and uploads the file straight to object storage. */
export async function uploadPhoto(updateId: string, kind: PhotoKind, file: File): Promise<void> {
  const ticket = await requestPhotoUpload(updateId, kind)

  let response: Response
  try {
    response = await fetch(ticket.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
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
}
