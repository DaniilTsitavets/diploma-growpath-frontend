import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { entitlementKey } from '@/features/entitlement/api/use-entitlement'
import { getEscalation, requestEscalation } from './escalation-api'

export const escalationKey = (updateId: string) => ['updates', updateId, 'escalation'] as const

const WAITING = ['requested', 'ticket_open']

/** The expert answers asynchronously, so an open escalation is polled. */
export function useEscalation(updateId: string) {
  return useQuery({
    queryKey: escalationKey(updateId),
    queryFn: ({ signal }) => getEscalation(updateId, signal),
    refetchInterval: (query) => (WAITING.includes(query.state.data?.status ?? '') ? 5000 : false),
  })
}

export function useRequestEscalation(updateId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (userQuestion: string | null) => requestEscalation(updateId, userQuestion),
    meta: { handledInline: true },
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: escalationKey(updateId) }),
        client.invalidateQueries({ queryKey: entitlementKey }),
      ]),
  })
}
