import { z } from 'zod'

export const ANSWER_LIMIT = 5000

export const answerSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Write your answer')
    .max(ANSWER_LIMIT, `Use at most ${ANSWER_LIMIT} characters`),
})

export type AnswerValues = z.infer<typeof answerSchema>
