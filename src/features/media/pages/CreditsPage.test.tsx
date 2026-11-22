import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { CreditsPage } from './CreditsPage'

const media = 'http://media.test/bucket'
const server = setupServer()

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  vi.unstubAllEnvs()
})
afterAll(() => server.close())

function renderPage() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <CreditsPage />
    </QueryClientProvider>,
  )
}

describe('CreditsPage', () => {
  it('credits PlantSolve with a link to the licence and lists every photo', async () => {
    vi.stubEnv('VITE_MEDIA_BASE_URL', media)
    server.use(
      http.get(`${media}/credits.json`, () =>
        HttpResponse.json([
          {
            slug: 'lavender',
            key: 'lavender.webp',
            author: 'PublicDomainPictures',
            license: 'Pixabay Content License',
            source: 'https://pixabay.com/photos/lavender-1727/',
          },
        ]),
      ),
    )
    renderPage()

    expect(screen.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by/4.0/',
    )
    expect(
      await screen.findByRole('link', { name: 'Photo by PublicDomainPictures on Pixabay' }),
    ).toHaveAttribute('href', 'https://pixabay.com/photos/lavender-1727/')
  })

  it('says so when the photo list cannot be loaded', async () => {
    vi.stubEnv('VITE_MEDIA_BASE_URL', media)
    server.use(http.get(`${media}/credits.json`, () => new HttpResponse(null, { status: 500 })))
    renderPage()

    expect(await screen.findByRole('alert', {}, { timeout: 4000 })).toHaveTextContent(
      'could not be loaded',
    )
  })
})
