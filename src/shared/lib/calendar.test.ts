import {
  addDays,
  addMonths,
  clampIso,
  endOfWeek,
  formatDayName,
  formatMonthTitle,
  isOutOfRange,
  monthGrid,
  parseIso,
  startOfWeek,
  weekday,
} from './calendar'

describe('calendar helpers', () => {
  it('parses only real ISO dates', () => {
    expect(parseIso('2026-11-23')).toEqual({ year: 2026, month: 11, day: 23 })
    expect(parseIso('2026-02-30')).toBeNull()
    expect(parseIso('23.11.2026')).toBeNull()
    expect(parseIso('')).toBeNull()
  })

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2024-02-28', 2)).toBe('2024-03-01')
  })

  it('adds months and keeps the last valid day', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
    expect(addMonths('2026-01-15', -2)).toBe('2025-11-15')
  })

  it('finds the week edges with Sunday first', () => {
    expect(weekday('2026-11-22')).toBe(0)
    expect(startOfWeek('2026-11-25')).toBe('2026-11-22')
    expect(endOfWeek('2026-11-25')).toBe('2026-11-28')
    expect(startOfWeek('2026-11-22')).toBe('2026-11-22')
  })

  it('clamps and detects dates outside the range', () => {
    expect(clampIso('2026-05-01', '2026-06-01', '2026-07-01')).toBe('2026-06-01')
    expect(clampIso('2026-08-01', '2026-06-01', '2026-07-01')).toBe('2026-07-01')
    expect(clampIso('2026-06-15', '2026-06-01', '2026-07-01')).toBe('2026-06-15')
    expect(clampIso('2026-06-15')).toBe('2026-06-15')
    expect(isOutOfRange('2026-06-15', undefined, '2026-06-14')).toBe(true)
    expect(isOutOfRange('2026-06-14', undefined, '2026-06-14')).toBe(false)
  })

  it('builds six Sunday-first weeks around the month', () => {
    const grid = monthGrid('2026-11-23')
    expect(grid).toHaveLength(6)
    expect(grid.every((week) => week.length === 7)).toBe(true)
    expect(grid[0]?.[0]).toEqual({ iso: '2026-11-01', inMonth: true })
    expect(grid[5]?.[6]?.iso).toBe('2026-12-12')
    expect(grid[5]?.[6]?.inMonth).toBe(false)
  })

  it('pads with days of the previous month when the month starts mid-week', () => {
    const grid = monthGrid('2026-07-10')
    expect(grid[0]?.[0]).toEqual({ iso: '2026-06-28', inMonth: false })
    expect(grid[0]?.[3]).toEqual({ iso: '2026-07-01', inMonth: true })
  })

  it('formats names without a zone shift', () => {
    expect(formatMonthTitle('2026-11-23')).toBe('November 2026')
    expect(formatDayName('2026-11-23')).toBe('November 23, 2026')
  })
})
