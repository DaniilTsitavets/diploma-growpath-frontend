import { ApiError } from '@/shared/api/api-error'

/** Problem codes are kebab-case; the entitlement service itself says "quota-exhausted". */
const AI_QUOTA_CODES = ['ai-quota-exhausted', 'quota-exhausted']

export const isAiQuotaExhausted = (error: unknown) =>
  error instanceof ApiError &&
  error.kind === 'conflict' &&
  AI_QUOTA_CODES.includes(error.code ?? '')

export const isExpertQuotaExhausted = (error: unknown) =>
  error instanceof ApiError && error.kind === 'conflict' && error.code === 'expert-quota-exhausted'
