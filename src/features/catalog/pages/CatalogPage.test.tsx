import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter } from 'react-router'
import { useSession } from '@/features/auth/model/session-store'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import type { Item } from '../model/types'
import { CatalogPage } from './CatalogPage'

const origin = window.location.origin
const items: Item[] = [
  {
    id: 'a1',
    item_type: 'pack',
    name: "Beginner's Kit",
    plant_species: 'Basil',
    seed_count: 5,
    price_cents: 2500,
    first_purchase_discount_pct: 20,
    labels: ['beginner'],
  },
  {
    id: 'b2',
    item_type: 'sensor',
    name: 'Soil Sensor',
    plant_species: null,
    seed_count: null,
    price_cents: 900,
    first_purchase_discount_pct: null,
    labels: [],
  },
]

const server = setupServer()
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(
    createHttpClient({
      getToken: () => useSession.getState().session?.idToken ?? null,
      onUnauthorized: () => undefined,
    }),
  )
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function signIn() {
  useSession.setState({
    session: {
      idToken: 't',
      refreshToken: 'r',
      email: 'a@b.test',
      groups: ['users'],
      expiresAt: Date.now() + 3_600_000,
    },
  })
}

function renderPage(path = '/shop') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <CatalogPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(signIn)
afterEach(() => useSession.setState({ session: null }))

describe('CatalogPage', () => {
  it('shows a loading state and then the items', async () => {
    server.use(http.get(`${origin}/v1/items`, () => HttpResponse.json(items)))
    renderPage()

    expect(screen.getByText('Loading the shop')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: "Beginner's Kit" })).toBeInTheDocument()
    expect(screen.getByText('2 items')).toBeInTheDocument()
  })

  it('filters by search text and sorts by price', async () => {
    server.use(http.get(`${origin}/v1/items`, () => HttpResponse.json(items)))
    renderPage()
    await screen.findByRole('heading', { name: 'Soil Sensor' })

    await userEvent.selectOptions(screen.getByLabelText('Sort by'), 'price-asc')
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['Soil Sensor', "Beginner's Kit"])

    await userEvent.type(screen.getByLabelText('Search'), 'basil')
    expect(screen.queryByRole('heading', { name: 'Soil Sensor' })).not.toBeInTheDocument()
    expect(screen.getByText('1 item')).toBeInTheDocument()
  })

  it('filters by a label chip and marks it as pressed', async () => {
    server.use(http.get(`${origin}/v1/items`, () => HttpResponse.json(items)))
    renderPage()
    await screen.findByRole('heading', { name: 'Soil Sensor' })

    const chip = screen.getByRole('button', { name: 'beginner' })
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(chip)

    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('heading', { name: 'Soil Sensor' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "Beginner's Kit" })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByRole('heading', { name: 'Soil Sensor' })).toBeInTheDocument()
  })

  it('lets a visitor read the shop and asks them to sign in to order', async () => {
    useSession.setState({ session: null })
    let authorization: string | null = 'unset'
    server.use(
      http.get(`${origin}/v1/items`, ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json(items)
      }),
    )
    renderPage()

    expect(await screen.findByRole('heading', { name: "Beginner's Kit" })).toBeInTheDocument()
    expect(authorization).toBeNull()
    expect(
      screen.getByRole('button', { name: "Sign in to order Beginner's Kit" }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('colours the label chips with different dots', async () => {
    server.use(http.get(`${origin}/v1/items`, () => HttpResponse.json(items)))
    renderPage()
    await screen.findByRole('heading', { name: 'Soil Sensor' })

    const chip = screen.getByRole('button', { name: 'beginner' })
    expect(chip.querySelector('[data-dot]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'All' }).querySelector('[data-dot]')).toBeNull()
  })

  it('asks a visitor to sign in while the gateway refuses anonymous reads', async () => {
    useSession.setState({ session: null })
    server.use(
      http.get(`${origin}/v1/items`, () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    )
    renderPage()

    const link = await screen.findByRole('link', { name: 'Sign in' })
    expect(link).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('search')).not.toBeInTheDocument()
  })

  it('starts filtered by the search text in the address', async () => {
    server.use(http.get(`${origin}/v1/items`, () => HttpResponse.json(items)))
    renderPage('/shop?q=soil')

    expect(await screen.findByRole('heading', { name: 'Soil Sensor' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: "Beginner's Kit" })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Search')).toHaveValue('soil')
  })

  it('shows an error with a retry that loads the catalog', async () => {
    let calls = 0
    server.use(
      http.get(`${origin}/v1/items`, () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ title: 'Service Unavailable', status: 503 }, { status: 503 })
          : HttpResponse.json(items)
      }),
    )
    renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('temporarily unavailable')
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: "Beginner's Kit" })).toBeInTheDocument()
  })

  it('places an order with an idempotency key and shows the receipt', async () => {
    let key: string | null = null
    server.use(
      http.get(`${origin}/v1/items`, () => HttpResponse.json(items)),
      http.post(`${origin}/v1/orders`, ({ request }) => {
        key = request.headers.get('Idempotency-Key')
        return HttpResponse.json(
          {
            id: 'o1',
            item_id: 'a1',
            list_price_cents: 2500,
            discount_cents: 500,
            total_paid_cents: 2000,
            placed_at: '2026-11-19T10:00:00Z',
          },
          { status: 201 },
        )
      }),
    )
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: "Order Beginner's Kit" }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirm order' }))

    expect(await screen.findByRole('heading', { name: 'Order placed' })).toBeInTheDocument()
    expect(screen.getByText('20.00')).toBeInTheDocument()
    await waitFor(() => expect(key).toMatch(/^[0-9a-f-]{36}$/))
  })
})
