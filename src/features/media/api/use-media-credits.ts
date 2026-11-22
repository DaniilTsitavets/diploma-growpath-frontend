import { useQuery } from '@tanstack/react-query'
import { mediaBaseUrl } from '@/shared/config/media'
import { fetchCredits } from './media-api'

/** Which items have a picture, and whom to credit. Disabled when the media bucket is not configured. */
export function useMediaCredits() {
  const base = mediaBaseUrl()
  return useQuery({
    queryKey: ['media', 'credits', base],
    queryFn: ({ signal }) => fetchCredits(base ?? '', signal),
    enabled: base !== null,
    staleTime: 5 * 60_000,
    retry: 1,
    meta: { handledInline: true },
  })
}
