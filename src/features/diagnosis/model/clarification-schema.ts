import { z } from 'zod'

export const CLARIFICATION_LIMIT = 1000

export const clarificationSchema = z.object({
  answer: z
    .string()
    .trim()
    .min(1, 'Write your answer')
    .max(CLARIFICATION_LIMIT, `Use at most ${CLARIFICATION_LIMIT} characters`),
})

export type ClarificationValues = z.infer<typeof clarificationSchema>
