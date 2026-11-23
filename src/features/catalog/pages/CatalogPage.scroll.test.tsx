import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider, ScrollRestoration } from 'react-router'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { CatalogPage } from './CatalogPage'

const origin = window.location.origin
const server = setupServer()

const item = (slug: string, name: string, type: string, labels: string[]) => ({
  id: slug,
  item_type: type,
  name,
  slug,
  plant_slug: type === 'pack' ? slug : null,
  plant_species: null,
  seed_count: null,
  price_cents: 1000,
  currency: 'EUR',
  first_purchase_discount_pct: null,
  labels,
})

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => null, onUnauthorized: () => undefined }))
})
afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

describe('CatalogPage scrolling', () => {
  it('keeps the scroll position when a filter is ticked or the sorting changes, as the app resets it on other moves', async () => {
    server.use(
      http.get(`${origin}/v1/items`, () =>
        HttpResponse.json({
          items: [
            item('a', 'Aloe Pack', 'pack', ['beginner']),
            item('b', 'Soil Sensor', 'sensor', []),
          ],
          next_cursor: null,
        }),
      ),
    )
    const router = createMemoryRouter(
      [
        {
          path: '/shop',
          element: (
            <>
              <CatalogPage />
              <ScrollRestoration />
            </>
          ),
        },
      ],
      { initialEntries: ['/shop'] },
    )
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
    await screen.findByRole('checkbox', { name: /beginner/ })
    const scrollTo = vi.spyOn(window, 'scrollTo')
    scrollTo.mockClear()

    await userEvent.click(screen.getByRole('checkbox', { name: /beginner/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sensors' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Price, low to high' }))

    expect(router.state.location.search).toContain('label=beginner')
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
