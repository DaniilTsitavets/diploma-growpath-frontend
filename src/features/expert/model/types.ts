import type { components } from '@/shared/api/schema/expert-consultation'

type Schemas = components['schemas']

export type TicketSummary = Schemas['TicketSummaryResponse']
export type TicketQueue = Schemas['QueueResponse']
export type Ticket = Schemas['TicketResponse']
export type TicketStatus = Schemas['TicketStatus']
export type TicketAnswer = Schemas['AnswerResponse']
export type TicketPhoto = Schemas['PhotoResponse']
