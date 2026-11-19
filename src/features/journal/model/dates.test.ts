import { formatDate, todayIso } from './dates'

describe('dates', () => {
  it('formats a date-only string without a time zone shift', () => {
    expect(formatDate('2026-11-19')).toBe('Nov 19, 2026')
  })

  it('builds the local calendar day', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})
