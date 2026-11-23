import { ApiError } from '@/shared/api/api-error'
import { describePlantingError } from './planting-errors'

describe('describePlantingError', () => {
  it('explains a planting that is already saved', () => {
    const error = new ApiError({
      status: 409,
      title: 'Conflict',
      code: 'planting-already-recorded',
    })
    expect(describePlantingError(error)).toMatch(/already saved/)
  })

  it('leaves other errors to the shared wording', () => {
    expect(describePlantingError(new ApiError({ status: 404, title: 'x' }))).toMatch(
      /could not find/,
    )
    expect(describePlantingError(new Error('x'))).toMatch(/Something went wrong/)
  })
})
