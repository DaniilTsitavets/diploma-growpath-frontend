import { z } from 'zod'

export const CHAT_QUESTION_LIMIT = 1000

export const chatQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, 'Write your question')
    .max(CHAT_QUESTION_LIMIT, `Use at most ${CHAT_QUESTION_LIMIT} characters`),
})

export type ChatQuestionValues = z.infer<typeof chatQuestionSchema>
