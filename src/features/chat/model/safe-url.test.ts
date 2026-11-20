import { safeHttpUrl } from './safe-url'

describe('safeHttpUrl', () => {
  it('keeps http and https addresses', () => {
    expect(safeHttpUrl('https://example.org/care#water')).toBe('https://example.org/care#water')
    expect(safeHttpUrl('http://example.org')).toBe('http://example.org/')
  })

  it('rejects other schemes and text that is not a URL', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpUrl('data:text/html,x')).toBeNull()
    expect(safeHttpUrl('kb/watering')).toBeNull()
  })
})
