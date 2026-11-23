import { useQuery } from '@tanstack/react-query'
import { getItem, listItems } from './catalog-api'

/** Reading the shop needs no account; the gateway still answers 401 until it allows anonymous reads. */
export function useItems() {
  return useQuery({ queryKey: ['items'], queryFn: ({ signal }) => listItems(signal) })
}

/** One item by its slug. A 404 is shown by the page itself, so it is not announced as a toast. */
export function useItem(slug: string) {
  return useQuery({
    queryKey: ['items', slug],
    queryFn: ({ signal }) => getItem(slug, signal),
    meta: { handledInline: true },
  })
}
