import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter } from 'react-router'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { ChatPage } from './ChatPage'

const origin = window.location.origin
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => 'token', onUnauthorized: () => undefined }))
})
beforeEach(() => {
  server.use(
    http.get(`${origin}/v1/me/entitlement`, () =>
      HttpResponse.json({
        user_id: 'u',
        tier: 'starter',
        tier_expires_at: null,
        ai_quota_today: { used: 1, limit: 3 },
        expert_quota_30_days: { used: 0, limit: 0 },
      }),
    ),
  )
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderPage() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const journal = (id: string, species: string) => ({
  id,
  order_id: 'o',
  species,
  planted_on: '2026-11-01',
  status: 'active',
  checkpoints: [],
})

describe('ChatPage', () => {
  it('links every plant to its chat and shows the AI checks left', async () => {
    server.use(
      http.get(`${origin}/v1/journals`, () =>
        HttpResponse.json({
          items: [journal('j1', 'Cactus'), journal('j2', 'Aloe Vera')],
          next_cursor: null,
        }),
      ),
    )
    renderPage()

    expect(await screen.findByRole('link', { name: 'Cactus' })).toHaveAttribute(
      'href',
      '/journals/j1/chat',
    )
    expect(screen.getByRole('link', { name: 'Aloe Vera' })).toHaveAttribute(
      'href',
      '/journals/j2/chat',
    )
    expect(await screen.findByText(/Left today: 2 of 3/)).toBeInTheDocument()
  })

  it('does not claim there are no journals while they are still loading', () => {
    server.use(http.get(`${origin}/v1/journals`, () => new Promise(() => undefined)))
    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading your plants')
    expect(screen.queryByText(/no journals yet/)).not.toBeInTheDocument()
  })

  it('sends a user without journals to the shop', async () => {
    server.use(
      http.get(`${origin}/v1/journals`, () => HttpResponse.json({ items: [], next_cursor: null })),
    )
    renderPage()

    expect(await screen.findByRole('link', { name: 'Order a pack' })).toHaveAttribute(
      'href',
      '/shop',
    )
  })
})
