import { ApiError } from '@/shared/api/api-error'
import { describePhotoError } from './photo-errors'

const problem = (status: number, code: string) => new ApiError({ status, title: 'x', code })

describe('describePhotoError', () => {
  it.each([
    [422, 'photo-too-large', /too large/],
    [422, 'photo-type-not-allowed', /HEIC/],
    [409, 'photo-not-uploaded', /did not reach/],
    [409, 'roots-photo-not-requested', /diagnosis asks/],
  ])('explains %s %s', (status, code, text) => {
    expect(describePhotoError(problem(status, code))).toMatch(text)
  })

  it('leaves other errors to the shared wording', () => {
    expect(describePhotoError(problem(500, 'whatever'))).toBeNull()
    expect(describePhotoError(new Error('x'))).toBeNull()
  })
})
