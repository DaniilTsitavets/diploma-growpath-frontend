import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SubmitUpdateRequest } from '../model/types'
import {
  getJournal,
  listJournals,
  listPhotos,
  listUpdates,
  recordPlanting,
  submitUpdate,
} from './journal-api'

export const journalKeys = {
  all: ['journals'] as const,
  detail: (journalId: string) => ['journals', journalId] as const,
  updates: (journalId: string) => ['journals', journalId, 'updates'] as const,
  photos: (updateId: string) => ['updates', updateId, 'photos'] as const,
}

/** `pollWhileEmpty`: the journal draft is created asynchronously after an order, so an empty list may fill in. */
export function useJournals(pollWhileEmpty: boolean) {
  return useQuery({
    queryKey: journalKeys.all,
    queryFn: ({ signal }) => listJournals(signal),
    refetchInterval: (query) => (pollWhileEmpty && query.state.data?.length === 0 ? 3000 : false),
  })
}

export function useJournal(journalId: string) {
  return useQuery({
    queryKey: journalKeys.detail(journalId),
    queryFn: ({ signal }) => getJournal(journalId, signal),
  })
}

export function useUpdates(journalId: string) {
  return useQuery({
    queryKey: journalKeys.updates(journalId),
    queryFn: ({ signal }) => listUpdates(journalId, signal),
  })
}

export function usePhotos(updateId: string) {
  return useQuery({
    queryKey: journalKeys.photos(updateId),
    queryFn: ({ signal }) => listPhotos(updateId, signal),
  })
}

export function useRecordPlanting(journalId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (plantedOn: string) => recordPlanting(journalId, plantedOn),
    meta: { handledInline: true },
    onSuccess: (journal) => {
      client.setQueryData(journalKeys.detail(journalId), journal)
      return client.invalidateQueries({ queryKey: journalKeys.all })
    },
  })
}

export function useSubmitUpdate(journalId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: SubmitUpdateRequest) => submitUpdate(journalId, body),
    meta: { handledInline: true },
    onSuccess: () => client.invalidateQueries({ queryKey: journalKeys.updates(journalId) }),
  })
}
