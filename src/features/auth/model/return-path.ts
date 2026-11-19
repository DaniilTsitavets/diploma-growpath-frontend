/** Accepts only paths inside this app, so a crafted link cannot send a signed-in user elsewhere. */
export function safeReturnPath(candidate: unknown, fallback = '/'): string {
  if (typeof candidate !== 'string') return fallback
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return fallback
  }
  if (candidate.startsWith('/login')) return fallback
  return candidate
}
