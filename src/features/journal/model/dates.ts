const formatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' })

/** Formats a date-only string (`YYYY-MM-DD`) without shifting it through the local time zone. */
export function formatDate(isoDate: string): string {
  return formatter.format(new Date(`${isoDate}T00:00:00Z`))
}

export function formatDateTime(isoDateTime: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(isoDateTime),
  )
}

/**
 * The latest date that may be entered as "done already". The backend compares with today's date in UTC, so a
 * traveller or someone just after local midnight east of UTC must not pick a day that is still ahead there.
 */
export function latestDateIso(now = new Date()): string {
  const utc = now.toISOString().slice(0, 10)
  const local = todayIso(now)
  return local < utc ? local : utc
}

export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
