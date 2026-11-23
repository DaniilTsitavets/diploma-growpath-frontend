import { ApiError } from '@/shared/api/api-error'
import { describeAdminError } from './errors'

const problem = (status: number, code: string) => new ApiError({ status, title: 'x', code })

describe('describeAdminError', () => {
  it.each([
    [409, 'user-exists', /already exists/],
    [422, 'invalid-password', /password policy/],
    [404, 'user-not-found', /no longer exists/],
    [409, 'cannot-modify-self', /your own account/],
  ])('explains %s %s', (status, code, text) => {
    expect(describeAdminError(problem(status, code))).toMatch(text)
  })

  it('falls back to the shared wording', () => {
    expect(describeAdminError(problem(500, 'whatever'))).toMatch(/server failed/)
    expect(describeAdminError(new Error('x'))).toMatch(/Something went wrong/)
  })
})
