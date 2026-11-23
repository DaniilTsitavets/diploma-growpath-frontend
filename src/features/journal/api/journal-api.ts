import { api } from '@/shared/api/client'
import { listAllPages } from '@/shared/api/pagination'
import type {
  Journal,
  PhotoKind,
  PlantUpdate,
  SubmitUpdateRequest,
  UpdateFeed,
  UpdatePhotos,
  UploadTicket,
} from '../model/types'

export const listJournals = (signal?: AbortSignal) => listAllPages<Journal>('/v1/journals', signal)

export const getJournal = (journalId: string, signal?: AbortSignal) =>
  api.request<Journal>('GET', `/v1/journals/${journalId}`, { signal })

export const recordPlanting = (journalId: string, plantedOn: string) =>
  api.request<Journal>('PUT', `/v1/journals/${journalId}/planting`, {
    body: { planted_on: plantedOn },
  })

export const listUpdates = (journalId: string, signal?: AbortSignal) =>
  api.request<UpdateFeed>('GET', `/v1/journals/${journalId}/updates`, { signal })

export const submitUpdate = (journalId: string, body: SubmitUpdateRequest) =>
  api.request<PlantUpdate>('POST', `/v1/journals/${journalId}/updates`, { body })

export const requestPhotoUpload = (updateId: string, kind: PhotoKind) =>
  api.request<UploadTicket>('POST', `/v1/updates/${updateId}/photos`, { body: { kind } })

export const listPhotos = (updateId: string, signal?: AbortSignal) =>
  api.request<UpdatePhotos>('GET', `/v1/updates/${updateId}/photos`, { signal })
