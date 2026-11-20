/** A short, human remaining time such as "2 d 4 h" or "35 min"; "expired" once the moment has passed. */
export function timeLeft(expiresAt: string, now = Date.now()): string {
  const minutes = Math.floor((new Date(expiresAt).getTime() - now) / 60_000)
  if (minutes <= 0) return 'expired'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ${minutes % 60} min`
  return `${Math.floor(hours / 24)} d ${hours % 24} h`
}
