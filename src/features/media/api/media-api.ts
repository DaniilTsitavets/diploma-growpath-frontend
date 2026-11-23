import { ApiError, networkApiError } from '@/shared/api/api-error'
import { creditsUrl } from '@/shared/config/media'
import { mediaCreditsSchema, type MediaCredit } from '../model/types'

/**
 * The author list of the pictures. It comes from the media bucket, not from the API, so no token is sent.
 * A missing file means that no pictures are published yet, which is an empty list and not an error.
 */
export async function fetchCredits(base: string): Promise<MediaCredit[]> {
  let response: Response
  try {
    response = await fetch(creditsUrl(base))
  } catch (cause) {
    throw networkApiError(cause)
  }
  if (response.status === 404) return []
  if (!response.ok) {
    throw new ApiError({ status: response.status, title: 'The picture credits are unavailable' })
  }
  const parsed = mediaCreditsSchema.safeParse(await response.json().catch(() => null))
  if (!parsed.success) {
    throw new ApiError({ status: 502, title: 'The picture credits have an unexpected format' })
  }
  return parsed.data
}
