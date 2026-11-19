import type { HttpClient, RequestOptions } from './http'

let current: HttpClient | undefined

/** Called once at startup so feature code can use `api` without importing the app layer. */
export function configureApi(client: HttpClient) {
  current = client
}

export const api = {
  request<T>(method: string, path: string, options?: RequestOptions): Promise<T> {
    if (!current) throw new Error('API client is not configured')
    return current.request<T>(method, path, options)
  },
}
