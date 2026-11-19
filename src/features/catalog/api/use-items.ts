import { useQuery } from '@tanstack/react-query'
import { listItems } from './catalog-api'

export function useItems() {
  return useQuery({ queryKey: ['items'], queryFn: ({ signal }) => listItems(signal) })
}
