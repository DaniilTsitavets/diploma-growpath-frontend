import { ApiError, apiErrorFromResponse, networkApiError } from './api-error'

export interface HttpClientOptions {
  getToken: () => Promise<string | null> | string | null
  onUnauthorized: () => void
}

export interface RequestOptions {
  query?: Record<string, string | number | undefined>
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

export interface HttpClient {
  request: <T>(method: string, path: string, options?: RequestOptions) => Promise<T>
}

/**
 * The only place that calls fetch for the gateway API (same origin, `/v1/...`):
 * adds the ID token and maps failures to ApiError.
 */
export function createHttpClient({ getToken, onUnauthorized }: HttpClientOptions): HttpClient {
  async function request<T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = new URL(path, window.location.origin)
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }

    const headers = new Headers(options.headers)
    headers.set('Accept', 'application/json')
    const token = await getToken()
    if (token) headers.set('Authorization', token)
    if (options.body !== undefined) headers.set('Content-Type', 'application/json')

    let response: Response
    try {
      response = await fetch(url, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal,
      })
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
      throw networkApiError(cause)
    }

    if (!response.ok) {
      const error = await apiErrorFromResponse(response)
      if (error.kind === 'unauthorized') onUnauthorized()
      throw error
    }
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }

  return { request }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
