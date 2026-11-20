import { useQuery } from '@tanstack/react-query'
import { listItems } from './catalog-api'

/** Reading the shop needs no account; the gateway still answers 401 until it allows anonymous reads. */
export function useItems() {
  return useQuery({ queryKey: ['items'], queryFn: ({ signal }) => listItems(signal) })
}
