import { ApiError } from '@/shared/api/api-error'

/** The backend uses "ai-quota-exhausted"; the architecture notes spell it "quota_exhausted". */
const AI_QUOTA_CODES = ['ai-quota-exhausted', 'quota_exhausted']

export const isAiQuotaExhausted = (error: unknown) =>
  error instanceof ApiError &&
  error.kind === 'conflict' &&
  AI_QUOTA_CODES.includes(error.code ?? '')

export const isExpertQuotaExhausted = (error: unknown) =>
  error instanceof ApiError && error.kind === 'conflict' && error.code === 'expert-quota-exhausted'
