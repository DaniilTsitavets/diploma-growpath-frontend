import { useQuery } from '@tanstack/react-query'
import { mediaBaseUrl } from '@/shared/config/media'
import { fetchCredits } from './media-api'

/**
 * Which items have a picture, and whom to credit. Every card and page shares this one query: it is fetched once
 * per session, and the request is not tied to a component, so it is never cancelled when a card unmounts.
 * Disabled when the media bucket is not configured.
 */
export function useMediaCredits() {
  const base = mediaBaseUrl()
  return useQuery({
    queryKey: ['media', 'credits', base],
    queryFn: () => fetchCredits(base ?? ''),
    enabled: base !== null,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    meta: { handledInline: true },
  })
}
