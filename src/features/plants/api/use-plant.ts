import { useQuery } from '@tanstack/react-query'
import { getPlant } from './plants-api'

/** Open without a token. Failures are shown in place of the care blocks, so they are not announced as toasts. */
export function usePlant(slug: string | null) {
  return useQuery({
    queryKey: ['plants', slug],
    queryFn: ({ signal }) => getPlant(slug ?? '', signal),
    enabled: slug !== null,
    // The item page and the care section share this request; a failed one must not be sent again on mount.
    retryOnMount: false,
    meta: { handledInline: true },
  })
}
