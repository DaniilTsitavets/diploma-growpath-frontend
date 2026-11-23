import { z } from 'zod'

/** The context snapshot that plant-care builds for the expert. Version 2 is current, version 1 (the retired questionnaire) is still read. */
export const SUPPORTED_CONTEXT_VERSIONS = [1, 2]

const text = z.string()
const optionalText = text.nullish().transform((value) => value ?? undefined)

// The update block is passed on as it came, so that both versions of the questionnaire can be shown.
const updateSchema = z.looseObject({ id: text })

const candidateSchema = z.object({ rank: z.number(), cause: text, rationale: text })

const diagnosisSchema = z.object({
  status: optionalText,
  has_dominant_candidate: z
    .boolean()
    .nullish()
    .transform((value) => value ?? undefined),
  candidates: z.array(candidateSchema).catch([]),
  recommendation: optionalText,
})

const historySchema = z.object({
  date: text,
  diagnosis_status: optionalText,
  top_cause: optionalText,
})

export type ContextUpdate = z.infer<typeof updateSchema>
export type ContextDiagnosis = z.infer<typeof diagnosisSchema>
export type ContextHistoryEntry = z.infer<typeof historySchema>

export interface TicketContext {
  /** False when the snapshot has a newer version: whatever is recognised is shown with a note. */
  supported: boolean
  species?: string
  update?: ContextUpdate
  userQuestion?: string
  diagnosis?: ContextDiagnosis
  clarification?: { question: string; answer?: string }
  history: ContextHistoryEntry[]
}

function field<T>(schema: z.ZodType<T>, value: unknown): T | undefined {
  const parsed = schema.safeParse(value)
  return parsed.success ? parsed.data : undefined
}

function parseHistory(raw: unknown): ContextHistoryEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((entry: unknown) => {
    const parsed = historySchema.safeParse(entry)
    return parsed.success ? [parsed.data] : []
  })
}

/**
 * Reads the untyped context defensively: only `species` and `update` are always sent, every other block
 * may be missing, and a block that does not look as expected is skipped instead of breaking the page.
 */
export function parseTicketContext(raw: unknown): TicketContext {
  const context = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const question = field(text, context.clarifying_question)
  return {
    supported:
      typeof context.schema_version === 'number' &&
      SUPPORTED_CONTEXT_VERSIONS.includes(context.schema_version),
    species: field(text, context.species),
    update: field(updateSchema, context.update),
    userQuestion: field(text, context.user_question),
    diagnosis: field(diagnosisSchema, context.diagnosis),
    clarification: question
      ? { question, answer: field(text, context.clarifying_answer) }
      : undefined,
    history: parseHistory(context.history),
  }
}

/** Translates an enum-like value through a dictionary and shows an unknown value as it is. */
export function humanize(labels: Record<string, string>, value: string | undefined): string {
  if (value === undefined) return 'Not given'
  return labels[value] ?? value
}
