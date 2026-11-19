import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter } from 'react-router'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { JournalsPage } from './JournalsPage'

const origin = window.location.origin
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => 'token', onUnauthorized: () => undefined }))
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderPage() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <JournalsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('JournalsPage', () => {
  it('lists journals with their planting state', async () => {
    server.use(
      http.get(`${origin}/v1/journals`, () =>
        HttpResponse.json([
          {
            id: 'j1',
            order_id: 'o1',
            species: 'Basil',
            planted_on: '2026-11-01',
            created_at: '2026-11-01T10:00:00Z',
            checkpoints: [],
          },
          {
            id: 'j2',
            order_id: 'o2',
            species: 'Mint',
            planted_on: null,
            created_at: '2026-11-02T10:00:00Z',
            checkpoints: [],
          },
        ]),
      ),
    )
    renderPage()

    expect(await screen.findByRole('link', { name: 'Basil' })).toHaveAttribute(
      'href',
      '/journals/j1',
    )
    expect(screen.getByText('Planted on Nov 1, 2026')).toBeInTheDocument()
    expect(screen.getByText('Not planted yet')).toBeInTheDocument()
  })

  it('explains that the journal is still being created when the list is empty', async () => {
    server.use(http.get(`${origin}/v1/journals`, () => HttpResponse.json([])))
    renderPage()

    expect(await screen.findByText(/Waiting for your journal/)).toBeInTheDocument()
  })

  it('shows an error with a retry', async () => {
    server.use(
      http.get(`${origin}/v1/journals`, () =>
        HttpResponse.json({ title: 'Internal Server Error', status: 500 }, { status: 500 }),
      ),
    )
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('server failed')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
