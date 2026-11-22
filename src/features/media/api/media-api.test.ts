import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { fetchCredits } from './media-api'

const base = 'http://media.test/bucket'
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('fetchCredits', () => {
  it('reads the list of credits', async () => {
    server.use(
      http.get(`${base}/credits.json`, () =>
        HttpResponse.json([
          {
            slug: 'lavender',
            key: 'lavender.webp',
            author: 'A',
            license: 'L',
            source: 'https://x.test/p',
          },
        ]),
      ),
    )
    await expect(fetchCredits(base)).resolves.toHaveLength(1)
  })

  it('reports a missing list and a list of the wrong shape', async () => {
    server.use(http.get(`${base}/credits.json`, () => new HttpResponse(null, { status: 404 })))
    await expect(fetchCredits(base)).rejects.toMatchObject({ status: 404 })

    server.use(http.get(`${base}/credits.json`, () => HttpResponse.json({ not: 'a list' })))
    await expect(fetchCredits(base)).rejects.toMatchObject({ status: 502 })
  })

  it('reports a network failure', async () => {
    server.use(http.get(`${base}/credits.json`, () => HttpResponse.error()))
    await expect(fetchCredits(base)).rejects.toMatchObject({ kind: 'network' })
  })
})
