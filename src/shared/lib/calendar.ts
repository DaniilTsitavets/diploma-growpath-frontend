/** Pure date-only calendar math on `YYYY-MM-DD` strings; UTC is used internally so no local zone shifts a day. */

export interface CalendarDay {
  iso: string
  inMonth: boolean
}

const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseIso(iso: string): { year: number; month: number; day: number } | null {
  const match = isoPattern.exec(iso)
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(Date.UTC(year, month - 1, day))
  const valid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  return valid ? { year, month, day } : null
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

export function addDays(iso: string, days: number): string {
  const date = toDate(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return toIso(date)
}

/** Moves by whole months and keeps the day, or the last day of a shorter target month. */
export function addMonths(iso: string, months: number): string {
  const date = toDate(iso)
  const day = date.getUTCDate()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  date.setUTCDate(Math.min(day, lastDay))
  return toIso(date)
}

/** Day of week, 0 = Sunday. */
export function weekday(iso: string): number {
  return toDate(iso).getUTCDay()
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`
}

export function startOfWeek(iso: string): string {
  return addDays(iso, -weekday(iso))
}

export function endOfWeek(iso: string): string {
  return addDays(iso, 6 - weekday(iso))
}

export function clampIso(iso: string, min?: string, max?: string): string {
  if (min && iso < min) return min
  if (max && iso > max) return max
  return iso
}

export function isOutOfRange(iso: string, min?: string, max?: string): boolean {
  return Boolean((min && iso < min) || (max && iso > max))
}

/** Six weeks starting on Sunday that contain the month of `iso`; a fixed size keeps the popover height stable. */
export function monthGrid(iso: string): CalendarDay[][] {
  const first = startOfMonth(iso)
  const start = startOfWeek(first)
  const month = first.slice(0, 7)
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const day = addDays(start, week * 7 + dayIndex)
      return { iso: day, inMonth: day.startsWith(month) }
    }),
  )
}

const monthTitle = new Intl.DateTimeFormat('en', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
const dayName = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' })

export function formatMonthTitle(iso: string): string {
  return monthTitle.format(toDate(iso))
}

export function formatDayName(iso: string): string {
  return dayName.format(toDate(iso))
}
