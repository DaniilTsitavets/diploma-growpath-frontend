import { api } from '@/shared/api/client'
import type { Ticket, TicketAnswer, TicketQueue } from '../model/types'

export const listTickets = (cursor?: string, signal?: AbortSignal) =>
  api.request<TicketQueue>('GET', '/v1/expert/tickets', { query: { cursor }, signal })

export const getTicket = (ticketId: string, signal?: AbortSignal) =>
  api.request<Ticket>('GET', `/v1/expert/tickets/${ticketId}`, { signal })

export const answerTicket = (ticketId: string, body: string) =>
  api.request<TicketAnswer>('POST', `/v1/expert/tickets/${ticketId}/answer`, { body: { body } })
