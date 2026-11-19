import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { PlantingForm } from './PlantingForm'

const origin = window.location.origin
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => 'token', onUnauthorized: () => undefined }))
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderForm() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PlantingForm journalId="j1" plantedOn={null} />
    </QueryClientProvider>,
  )
}

describe('PlantingForm', () => {
  it('requires a date before sending', async () => {
    renderForm()
    await userEvent.click(screen.getByRole('button', { name: 'Record planting' }))

    expect(await screen.findByText('Choose the planting date')).toBeInTheDocument()
  })

  it('sends the chosen planting date', async () => {
    let body: unknown
    server.use(
      http.put(`${origin}/v1/journals/j1/planting`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({
          id: 'j1',
          order_id: 'o1',
          species: 'Basil',
          planted_on: '2026-11-01',
          created_at: '2026-11-01T10:00:00Z',
          checkpoints: [],
        })
      }),
    )
    renderForm()
    await userEvent.type(screen.getByLabelText('Planting date'), '2026-11-01')
    await userEvent.click(screen.getByRole('button', { name: 'Record planting' }))

    await vi.waitFor(() => expect(body).toEqual({ planted_on: '2026-11-01' }))
  })

  it('shows the server error next to the form', async () => {
    server.use(
      http.put(`${origin}/v1/journals/j1/planting`, () =>
        HttpResponse.json({ title: 'Not Found', status: 404 }, { status: 404 }),
      ),
    )
    renderForm()
    await userEvent.type(screen.getByLabelText('Planting date'), '2026-11-01')
    await userEvent.click(screen.getByRole('button', { name: 'Record planting' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('could not find')
  })
})
