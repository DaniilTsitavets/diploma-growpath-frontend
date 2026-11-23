import { ApiError } from '@/shared/api/api-error'
import { isAiQuotaExhausted, isExpertQuotaExhausted } from './errors'

const conflict = (code: string) => new ApiError({ status: 409, title: 'Conflict', code })

describe('quota errors', () => {
  it('recognises both spellings of the AI quota code', () => {
    expect(isAiQuotaExhausted(conflict('ai-quota-exhausted'))).toBe(true)
    expect(isAiQuotaExhausted(conflict('quota-exhausted'))).toBe(true)
    expect(isAiQuotaExhausted(conflict('diagnosis-conflict'))).toBe(false)
  })

  it('recognises the expert quota code', () => {
    expect(isExpertQuotaExhausted(conflict('expert-quota-exhausted'))).toBe(true)
    expect(isExpertQuotaExhausted(new Error('x'))).toBe(false)
  })
})
