import { useQuery } from '@tanstack/react-query'
import { listItems } from './catalog-api'

/** `enabled` is false for visitors: the gateway answers 401 to a request without a token. */
export function useItems(enabled = true) {
  return useQuery({
    queryKey: ['items'],
    queryFn: ({ signal }) => listItems(signal),
    enabled,
  })
}
