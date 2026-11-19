import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { entitlementKey } from '@/features/entitlement/api/use-entitlement'
import { answerClarification, declineEscalation, getDiagnosis, runDiagnosis } from './diagnosis-api'

export const diagnosisKey = (updateId: string) => ['updates', updateId, 'diagnosis'] as const

export function useDiagnosis(updateId: string) {
  return useQuery({
    queryKey: diagnosisKey(updateId),
    queryFn: ({ signal }) => getDiagnosis(updateId, signal),
  })
}

/** Every change of the diagnosis also changes the update feed (status, requested roots photo) and the quota. */
function useRefreshAfter(updateId: string, journalId: string) {
  const client = useQueryClient()
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: diagnosisKey(updateId) }),
      client.invalidateQueries({ queryKey: ['journals', journalId, 'updates'] }),
      client.invalidateQueries({ queryKey: entitlementKey }),
    ])
}

export function useRunDiagnosis(updateId: string, journalId: string) {
  const refresh = useRefreshAfter(updateId, journalId)
  return useMutation({
    mutationFn: () => runDiagnosis(updateId),
    meta: { handledInline: true },
    onSettled: refresh,
  })
}

export function useAnswerClarification(updateId: string, journalId: string) {
  const refresh = useRefreshAfter(updateId, journalId)
  return useMutation({
    mutationFn: (answer: string) => answerClarification(updateId, answer),
    meta: { handledInline: true },
    onSettled: refresh,
  })
}

export function useDeclineEscalation(updateId: string, journalId: string) {
  const refresh = useRefreshAfter(updateId, journalId)
  return useMutation({
    mutationFn: () => declineEscalation(updateId),
    meta: { handledInline: true },
    onSettled: refresh,
  })
}
