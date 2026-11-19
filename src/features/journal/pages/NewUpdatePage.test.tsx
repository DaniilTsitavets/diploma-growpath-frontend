import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { NewUpdatePage } from './NewUpdatePage'

const origin = window.location.origin
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => 'token', onUnauthorized: () => undefined }))
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: '/journals/:journalId/updates/new', element: <NewUpdatePage /> },
      { path: '/journals/:journalId/updates/:updateId', element: <h1>Update page</h1> },
    ],
    { initialEntries: ['/journals/j1/updates/new'] },
  )
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('NewUpdatePage', () => {
  it('shows an error for every unanswered questionnaire field', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Save and add photos' }))

    expect(await screen.findAllByText('Choose an option')).toHaveLength(4)
    expect(screen.getByLabelText('Drainage')).toHaveAttribute('aria-invalid', 'true')
  })

  it('submits the answers and opens the update page', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(`${origin}/v1/journals/j1/updates`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: body.id, journal_id: 'j1' }, { status: 201 })
      }),
    )
    renderPage()
    await userEvent.selectOptions(screen.getByLabelText('Drainage'), 'poor')
    await userEvent.selectOptions(screen.getByLabelText('Lighting'), 'low')
    await userEvent.selectOptions(screen.getByLabelText('Soil by finger test'), 'wet')
    await userEvent.selectOptions(screen.getByLabelText('Pot weight'), 'heavier')
    await userEvent.type(screen.getByLabelText('Watering interval, days'), '3')
    await userEvent.click(screen.getByRole('button', { name: 'Save and add photos' }))

    expect(await screen.findByRole('heading', { name: 'Update page' })).toBeInTheDocument()
    expect(body).toMatchObject({
      drainage: 'poor',
      lighting: 'low',
      finger_test: 'wet',
      pot_weight: 'heavier',
      watering_interval_days: 3,
      last_watered_on: null,
      sensor_reading: null,
    })
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/)
  })
})
