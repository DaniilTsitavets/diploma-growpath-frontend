export interface IdTokenClaims {
  sub: string
  email: string | null
  groups: string[]
  expiresAt: number
}

function decodeBase64Url(value: string): string {
  const padded = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  return new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)))
}

/** Reads claims for display and routing only; the gateway is what verifies the token. */
export function readIdToken(token: string): IdTokenClaims {
  const payload = token.split('.')[1]
  if (!payload) throw new Error('Malformed ID token')
  const claims = JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>
  const groups = claims['cognito:groups']
  return {
    sub: typeof claims.sub === 'string' ? claims.sub : '',
    email: typeof claims.email === 'string' ? claims.email : null,
    groups: Array.isArray(groups) ? groups.filter((g): g is string => typeof g === 'string') : [],
    expiresAt: Number(claims.exp ?? 0) * 1000,
  }
}
