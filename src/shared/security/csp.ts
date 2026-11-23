/**
 * The Content Security Policy of the built application, written in one place and used by the build (a meta tag and
 * a headers file for the host) and by the preview server (real headers).
 *
 * The page loads no inline script or style and no third-party script, so scripts and styles are limited to the
 * page's own origin: no nonce and no hash is needed, and the policy stays valid for a static host.
 */

export interface CspOptions {
  /** Cognito endpoint: sign-in is a fetch to it. */
  cognitoEndpoint?: string
  /** Bucket with the item pictures: the pictures are images and the credits list is fetched. */
  mediaBaseUrl?: string
  /** Further origins for fetches and images, for the object storage the presigned photo links point to. */
  extraOrigins?: string[]
}

export type CspTarget = 'header' | 'meta'

/** The origin of a configured address, or null when it is empty or not a web address. */
export function originOf(address: string | undefined): string | null {
  if (!address?.trim()) return null
  try {
    const url = new URL(address.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null
  } catch {
    return null
  }
}

export function parseOrigins(list: string | undefined): string[] {
  return (list ?? '')
    .split(',')
    .map((item) => originOf(item))
    .filter((origin): origin is string => origin !== null)
}

const unique = (values: (string | null | undefined)[]) => [
  ...new Set(values.filter((value): value is string => Boolean(value))),
]

/**
 * `meta` leaves out what a meta tag cannot carry (`frame-ancestors`, reporting); the same directives as a header
 * are used when the host can send headers.
 */
export function buildCsp(options: CspOptions = {}, target: CspTarget = 'header'): string {
  const remote = unique([
    originOf(options.cognitoEndpoint),
    originOf(options.mediaBaseUrl),
    ...(options.extraOrigins ?? []),
  ])
  const connect = unique([
    "'self'",
    originOf(options.cognitoEndpoint),
    originOf(options.mediaBaseUrl),
    ...(options.extraOrigins ?? []),
  ])
  const images = unique(["'self'", 'data:', 'blob:', ...remote])

  const directives = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    `img-src ${images.join(' ')}`,
    "font-src 'self'",
    `connect-src ${connect.join(' ')}`,
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "worker-src 'none'",
    "require-trusted-types-for 'script'",
  ]
  if (target === 'header') directives.push("frame-ancestors 'none'")
  return directives.join('; ')
}

/** The headers a host should send with every response, next to the policy. */
export function securityHeaders(options: CspOptions = {}): Record<string, string> {
  return {
    'Content-Security-Policy': buildCsp(options, 'header'),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
  }
}
