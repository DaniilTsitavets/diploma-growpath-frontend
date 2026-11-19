import { ApiError } from '@/shared/api/api-error'
import { api } from '@/shared/api/client'
import type { Escalation } from '../model/types'

/** An update without an escalation answers 404, which here simply means "none yet". */
export async function getEscalation(updateId: string, signal?: AbortSignal) {
  try {
    return await api.request<Escalation>('GET', `/v1/updates/${updateId}/escalation`, { signal })
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'not-found') return null
    throw error
  }
}

export const requestEscalation = (updateId: string, userQuestion: string | null) =>
  api.request<Escalation>('POST', `/v1/updates/${updateId}/escalation`, {
    body: { user_question: userQuestion },
  })
