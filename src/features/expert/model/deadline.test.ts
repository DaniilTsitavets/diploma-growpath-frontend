import { timeLeft } from './deadline'

const now = Date.parse('2026-11-20T10:00:00Z')
const at = (offsetMinutes: number) => new Date(now + offsetMinutes * 60_000).toISOString()

describe('timeLeft', () => {
  it('formats minutes, hours and days', () => {
    expect(timeLeft(at(35), now)).toBe('35 min')
    expect(timeLeft(at(150), now)).toBe('2 h 30 min')
    expect(timeLeft(at(60 * 52), now)).toBe('2 d 4 h')
  })

  it('says expired for a past or current moment', () => {
    expect(timeLeft(at(0), now)).toBe('expired')
    expect(timeLeft(at(-5), now)).toBe('expired')
  })
})
