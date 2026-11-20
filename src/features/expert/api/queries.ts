import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { answerTicket, getTicket, listTickets } from './expert-api'

const queueKey = ['expert', 'tickets'] as const
const ticketKey = (ticketId: string) => ['expert', 'tickets', ticketId] as const

export function useTicketQueue() {
  return useInfiniteQuery({
    queryKey: queueKey,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => listTickets(pageParam, signal),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })
}

/** Reading a ticket issues fresh presigned photo URLs, so the data is not kept for reuse. */
export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ticketKey(ticketId),
    queryFn: ({ signal }) => getTicket(ticketId, signal),
    staleTime: 0,
  })
}

export function useAnswerTicket(ticketId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => answerTicket(ticketId, body),
    meta: { handledInline: true },
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ticketKey(ticketId) }),
        client.invalidateQueries({ queryKey: queueKey }),
      ]),
  })
}
