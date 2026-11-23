import { homePath, roleFromGroups, roleOf } from './role'

describe('roles', () => {
  it('treats a user in no group as a customer', () => {
    expect(roleOf({ user_id: 'u', role: null, groups: [] })).toBe('user')
    expect(roleOf({ user_id: 'u', role: 'expert', groups: ['experts'] })).toBe('expert')
  })

  it('starts every role at its own page', () => {
    expect(homePath('user')).toBe('/')
    expect(homePath(null)).toBe('/')
    expect(homePath('expert')).toBe('/expert/tickets')
    expect(homePath('admin')).toBe('/admin/users')
  })
})

describe('roleFromGroups', () => {
  it('ranks the groups of a token', () => {
    expect(roleFromGroups(['experts', 'admins'])).toBe('admin')
    expect(roleFromGroups(['experts'])).toBe('expert')
    expect(roleFromGroups([])).toBe('user')
  })
})
