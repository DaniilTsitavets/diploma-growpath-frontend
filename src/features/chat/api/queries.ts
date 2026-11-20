import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { entitlementKey } from '@/features/entitlement/api/use-entitlement'
import { askQuestion, listTurns } from './chat-api'

const historyKey = (journalId: string) => ['journals', journalId, 'chat'] as const

export function useChatHistory(journalId: string) {
  return useInfiniteQuery({
    queryKey: historyKey(journalId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => listTurns(journalId, pageParam, signal),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })
}

/**
 * The id identifies one question. It is kept after an answer without a stored turn (`sources_only`),
 * because the backend allows sending the same id again, and renewed once the turn is stored.
 */
export function useAskQuestion(journalId: string) {
  const client = useQueryClient()
  const [turnId, setTurnId] = useState(() => crypto.randomUUID())
  const mutation = useMutation({
    mutationFn: (question: string) => askQuestion(journalId, turnId, question),
    meta: { handledInline: true },
    onSuccess: (turn) => {
      if (turn.outcome !== 'sources_only') setTurnId(crypto.randomUUID())
    },
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: historyKey(journalId) }),
        client.invalidateQueries({ queryKey: entitlementKey }),
      ]),
  })
  return mutation
}
