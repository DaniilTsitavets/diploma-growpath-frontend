export type ApiErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'validation'
  | 'unavailable'
  | 'server'
  | 'unknown'

export interface ApiErrorInit {
  status: number
  title: string
  detail?: string | null
  code?: string
  correlationId?: string | null
  retryAfterSeconds?: number
  fieldErrors?: unknown[]
}

function kindFor(status: number): ApiErrorKind {
  if (status === 0) return 'network'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not-found'
  if (status === 409) return 'conflict'
  if (status === 422) return 'validation'
  if (status === 503) return 'unavailable'
  if (status >= 500) return 'server'
  return 'unknown'
}

export class ApiError extends Error {
  readonly status: number
  readonly kind: ApiErrorKind
  readonly title: string
  readonly detail: string | null
  readonly code: string | undefined
  readonly correlationId: string | null
  readonly retryAfterSeconds: number | undefined
  readonly fieldErrors: unknown[]

  constructor(init: ApiErrorInit) {
    super(init.detail ?? init.title)
    this.name = 'ApiError'
    this.status = init.status
    this.kind = kindFor(init.status)
    this.title = init.title
    this.detail = init.detail ?? null
    this.code = init.code
    this.correlationId = init.correlationId ?? null
    this.retryAfterSeconds = init.retryAfterSeconds
    this.fieldErrors = init.fieldErrors ?? []
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/**
 * Backend services answer with RFC 7807 problem+json, while the API gateway
 * answers its own 401/403 with {"message": "..."}; both shapes are accepted.
 */
export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }
  const problem = isRecord(body) ? body : {}
  const retryAfter = Number(response.headers.get('Retry-After'))
  return new ApiError({
    status: response.status,
    title: text(problem.title) ?? text(problem.message) ?? response.statusText ?? 'Request failed',
    detail: text(problem.detail) ?? text(problem.message),
    code: text(problem.code),
    correlationId: text(problem.correlation_id) ?? response.headers.get('X-Correlation-Id'),
    retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    fieldErrors: Array.isArray(problem.errors) ? problem.errors : undefined,
  })
}

export function networkApiError(cause: unknown): ApiError {
  return new ApiError({
    status: 0,
    title: 'Network error',
    detail: cause instanceof Error ? cause.message : undefined,
  })
}
