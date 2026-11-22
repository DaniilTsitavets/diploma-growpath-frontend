import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter } from 'react-router'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import type { Item } from '@/features/catalog/model/types'
import { HomePage } from './HomePage'

const origin = window.location.origin
const server = setupServer()

const item = (index: number): Item => ({
  id: `id-${index}`,
  item_type: 'pack',
  name: `Pack ${index}`,
  slug: `pack-${index}`,
  plant_slug: `pack-${index}`,
  plant_species: `Plant ${index}`,
  seed_count: 5,
  price_cents: 1000 + index,
  first_purchase_discount_pct: null,
  labels: [],
})

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => null, onUnauthorized: () => undefined }))
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderPage() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('HomePage', () => {
  it('shows the first eight items of the shop and a link to all of them', async () => {
    server.use(
      http.get(`${origin}/v1/items`, () =>
        HttpResponse.json(Array.from({ length: 12 }, (_, index) => item(index + 1))),
      ),
    )
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Pack 8' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Pack 9' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /See everything/ })).toHaveAttribute('href', '/shop')
  })

  it('asks a visitor to sign in while the gateway refuses anonymous reads', async () => {
    server.use(
      http.get(`${origin}/v1/items`, () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    )
    renderPage()

    expect(await screen.findByText(/Sign in to see the packs/)).toBeInTheDocument()
  })
})
