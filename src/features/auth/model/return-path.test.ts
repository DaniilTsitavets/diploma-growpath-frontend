import { safeReturnPath } from './return-path'

describe('safeReturnPath', () => {
  it('keeps a path of this app with its query', () => {
    expect(safeReturnPath('/shop?q=basil')).toBe('/shop?q=basil')
    expect(safeReturnPath('/journals/1/updates/2')).toBe('/journals/1/updates/2')
  })

  it('falls back for anything that could leave the app', () => {
    expect(safeReturnPath('https://evil.test')).toBe('/')
    expect(safeReturnPath('//evil.test')).toBe('/')
    expect(safeReturnPath('/\\evil.test')).toBe('/')
    expect(safeReturnPath(undefined)).toBe('/')
  })

  it('never returns to the sign-in page itself', () => {
    expect(safeReturnPath('/login')).toBe('/')
  })
})
