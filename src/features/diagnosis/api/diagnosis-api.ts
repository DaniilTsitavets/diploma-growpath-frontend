import { api } from '@/shared/api/client'
import type { Diagnosis } from '../model/types'

export const getDiagnosis = (updateId: string, signal?: AbortSignal) =>
  api.request<Diagnosis>('GET', `/v1/updates/${updateId}/diagnosis`, { signal })

/** Runs the diagnosis or retries it after a failure; the request waits for the model. */
export const runDiagnosis = (updateId: string) =>
  api.request<Diagnosis>('POST', `/v1/updates/${updateId}/diagnosis`)

export const answerClarification = (updateId: string, answer: string) =>
  api.request<Diagnosis>('POST', `/v1/updates/${updateId}/diagnosis/clarification`, {
    body: { answer },
  })

export const declineEscalation = (updateId: string) =>
  api.request<Diagnosis>('POST', `/v1/updates/${updateId}/diagnosis/escalation-decline`)
