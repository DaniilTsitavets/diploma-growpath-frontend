import type { components } from '@/shared/api/schema/plant-care'

type Schemas = components['schemas']

export type ChatTurn = Schemas['ChatTurnResponse']
export type ChatOutcome = ChatTurn['outcome']
export type ChatHistory = Schemas['ChatHistoryResponse']
export type ChatSource = Schemas['SourceResponse']
export type RelatedSection = Schemas['RelatedSectionResponse']
