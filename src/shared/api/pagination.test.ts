import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { configureApi } from './client'
import { createHttpClient } from './http'
import { listAllPages } from './pagination'

const origin = window.location.origin
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => null, onUnauthorized: () => undefined }))
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('listAllPages', () => {
  it('follows next_cursor until the list ends and asks for the largest page', async () => {
    const seen: (string | null)[] = []
    server.use(
      http.get(`${origin}/v1/things`, ({ request }) => {
        const url = new URL(request.url)
        seen.push(url.searchParams.get('cursor'))
        expect(url.searchParams.get('limit')).toBe('100')
        return url.searchParams.get('cursor')
          ? HttpResponse.json({ items: [3], next_cursor: null })
          : HttpResponse.json({ items: [1, 2], next_cursor: 'c1' })
      }),
    )

    await expect(listAllPages<number>('/v1/things')).resolves.toEqual([1, 2, 3])
    expect(seen).toEqual([null, 'c1'])
  })
})
