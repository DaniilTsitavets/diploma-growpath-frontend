import { api } from '@/shared/api/client'
import type { ChatHistory, ChatTurn } from '../model/types'

export const askQuestion = (journalId: string, turnId: string, question: string) =>
  api.request<ChatTurn>('POST', `/v1/journals/${journalId}/chat/turns`, {
    body: { id: turnId, question },
  })

export const listTurns = (journalId: string, before?: string, signal?: AbortSignal) =>
  api.request<ChatHistory>('GET', `/v1/journals/${journalId}/chat/turns`, {
    query: { before },
    signal,
  })
