import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ApiError } from './api-error'
import { createHttpClient } from './http'

const base = window.location.origin
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function client(onUnauthorized = vi.fn()) {
  return {
    onUnauthorized,
    http: createHttpClient({ getToken: () => 'id-token', onUnauthorized }),
  }
}

describe('createHttpClient', () => {
  it('sends the ID token and returns parsed JSON', async () => {
    let auth: string | null = null
    server.use(
      http.get(`${base}/v1/items`, ({ request }) => {
        auth = request.headers.get('Authorization')
        return HttpResponse.json([{ id: '1' }])
      }),
    )
    const result = await client().http.request('GET', '/v1/items')
    expect(result).toEqual([{ id: '1' }])
    expect(auth).toBe('id-token')
  })

  it('maps problem+json to ApiError with code and correlation id', async () => {
    server.use(
      http.post(`${base}/v1/orders`, () =>
        HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: 'Quota used',
            code: 'ai-quota-exhausted',
            correlation_id: 'c-1',
          },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    const error = await client()
      .http.request('POST', '/v1/orders', { body: {} })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      kind: 'conflict',
      code: 'ai-quota-exhausted',
      correlationId: 'c-1',
    })
  })

  it('reads Retry-After on 503', async () => {
    server.use(
      http.get(`${base}/v1/items`, () =>
        HttpResponse.json(
          { title: 'Service Unavailable', status: 503 },
          { status: 503, headers: { 'Retry-After': '5' } },
        ),
      ),
    )
    const error = await client()
      .http.request('GET', '/v1/items')
      .catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'unavailable', retryAfterSeconds: 5 })
  })

  it('accepts the gateway message format and signals 401', async () => {
    server.use(
      http.get(`${base}/v1/items`, () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    )
    const { http: api, onUnauthorized } = client()
    const error = await api.request('GET', '/v1/items').catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'unauthorized', title: 'Unauthorized' })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('reports a network failure as ApiError', async () => {
    server.use(http.get(`${base}/v1/items`, () => HttpResponse.error()))
    const error = await client()
      .http.request('GET', '/v1/items')
      .catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'network' })
  })
})
