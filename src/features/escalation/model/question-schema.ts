import { z } from 'zod'

export const QUESTION_LIMIT = 1000

/** The question is optional while the AI is offering an expert; otherwise the expert needs one to start from. */
export function questionSchema(required: boolean) {
  const text = z.string().trim().max(QUESTION_LIMIT, `Use at most ${QUESTION_LIMIT} characters`)
  return z.object({
    question: required ? text.min(1, 'Describe what you want to ask the expert') : text,
  })
}

export type QuestionValues = { question: string }
