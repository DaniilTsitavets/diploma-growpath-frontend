import { formatDate, latestDateIso, todayIso } from './dates'

describe('dates', () => {
  it('formats a date-only string without a time zone shift', () => {
    expect(formatDate('2026-11-19')).toBe('Nov 19, 2026')
  })

  it('builds the local calendar day', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })

  it('never goes past today in UTC, which is what the backend compares with', () => {
    const now = new Date('2026-11-25T23:30:00Z')
    expect(latestDateIso(now) <= now.toISOString().slice(0, 10)).toBe(true)
    expect(latestDateIso(now) <= todayIso(now)).toBe(true)
  })
})
