import { readIdToken } from './jwt'

function token(payload: object) {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '')
  return `${encode({ alg: 'none' })}.${encode(payload)}.signature`
}

describe('readIdToken', () => {
  it('reads email, groups and expiry', () => {
    const claims = readIdToken(
      token({ sub: 'u1', email: 'a@b.test', 'cognito:groups': ['users', 'experts'], exp: 2000 }),
    )
    expect(claims).toEqual({
      sub: 'u1',
      email: 'a@b.test',
      groups: ['users', 'experts'],
      expiresAt: 2_000_000,
    })
  })

  it('treats a missing groups claim as no groups', () => {
    expect(readIdToken(token({ sub: 'u1', exp: 1 })).groups).toEqual([])
  })

  it('rejects a malformed token', () => {
    expect(() => readIdToken('nope')).toThrow('Malformed ID token')
  })
})
