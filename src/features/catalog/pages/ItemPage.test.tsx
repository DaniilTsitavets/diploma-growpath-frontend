import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route, Routes } from 'react-router'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { ItemPage } from './ItemPage'

const origin = window.location.origin
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => null, onUnauthorized: () => undefined }))
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const pack = {
  id: 'i1',
  item_type: 'pack',
  name: 'Lavender Starter Pack',
  slug: 'lavender',
  plant_slug: 'lavender',
  plant_species: 'Lavender',
  seed_count: 5,
  price_cents: 1500,
  first_purchase_discount_pct: null,
  labels: ['beginner'],
}

const plant = {
  slug: 'lavender',
  species: 'Lavender',
  sources: [
    {
      name: 'PlantSolve',
      url: 'https://www.plantsolve.com/plants/lavender/',
      license: 'CC BY 4.0',
    },
  ],
  updated_at: '2026-11-01',
  quick_answer: 'Give it full sun.',
  watering: 'Let the soil dry out.',
  toxicity: 'Mild.\nKeep from pets.',
}

function renderPage(slug = 'lavender') {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[`/shop/${slug}`]}>
        <Routes>
          <Route path="/shop/:slug" element={<ItemPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ItemPage', () => {
  it('shows the item and the care blocks that came, with the PlantSolve attribution', async () => {
    server.use(
      http.get(`${origin}/v1/items/lavender`, () => HttpResponse.json(pack)),
      http.get(`${origin}/v1/plants/lavender`, () => HttpResponse.json(plant)),
    )
    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Lavender Starter Pack', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText('€15.00')).toBeInTheDocument()
    expect(await screen.findByText('Give it full sun.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Watering' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Soil' })).toBeInTheDocument()
    expect(screen.getAllByText('Not specified').length).toBeGreaterThan(0)
    expect(screen.getByText('Keep from pets.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PlantSolve' })).toHaveAttribute(
      'href',
      'https://www.plantsolve.com/plants/lavender/',
    )
    expect(screen.getByText(/CC BY 4.0/)).toBeInTheDocument()
  })

  it('asks for the item and the plant at the same time', async () => {
    let plantAsked: () => void = () => undefined
    const plantRequested = new Promise<void>((resolve) => (plantAsked = resolve))
    server.use(
      http.get(`${origin}/v1/items/lavender`, async () => {
        await plantRequested
        return HttpResponse.json(pack)
      }),
      http.get(`${origin}/v1/plants/lavender`, () => {
        plantAsked()
        return HttpResponse.json(plant)
      }),
    )
    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Lavender Starter Pack', level: 1 }),
    ).toBeInTheDocument()
  })

  it('keeps the item and the order button when care information is unavailable, and can retry', async () => {
    let calls = 0
    server.use(
      http.get(`${origin}/v1/items/lavender`, () => HttpResponse.json(pack)),
      http.get(`${origin}/v1/plants/lavender`, () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json(
              { title: 'Service Unavailable', status: 503 },
              {
                status: 503,
                headers: { 'Content-Type': 'application/problem+json', 'Retry-After': '5' },
              },
            )
          : HttpResponse.json(plant)
      }),
    )
    renderPage()

    expect(
      await screen.findByText('Care information is unavailable right now.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in to order' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Give it full sun.')).toBeInTheDocument()
  })

  it('shows no care section for an item without a plant', async () => {
    server.use(
      http.get(`${origin}/v1/plants/thermo`, () => new HttpResponse(null, { status: 404 })),
      http.get(`${origin}/v1/items/thermo`, () =>
        HttpResponse.json({
          ...pack,
          item_type: 'sensor',
          name: 'Thermo',
          slug: 'thermo',
          plant_slug: null,
          plant_species: null,
          seed_count: null,
          labels: [],
        }),
      ),
    )
    renderPage('thermo')

    expect(await screen.findByRole('heading', { name: 'Thermo', level: 1 })).toBeInTheDocument()
    expect(screen.queryByText(/care information/i)).not.toBeInTheDocument()
  })

  it('says so when the item does not exist', async () => {
    server.use(
      http.get(`${origin}/v1/items/nope`, () =>
        HttpResponse.json(
          { title: 'Not Found', status: 404 },
          { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderPage('nope')

    expect(await screen.findByRole('heading', { name: 'Item not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the shop' })).toHaveAttribute('href', '/shop')
  })
})
