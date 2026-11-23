import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { formatDayName } from '@/shared/lib/calendar'
import { formatDate, todayIso } from '../model/dates'
import { PlantingForm } from './PlantingForm'

const origin = window.location.origin
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => 'token', onUnauthorized: () => undefined }))
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// The first day of the current month is never in the future, whatever today is.
const firstOfMonth = `${todayIso().slice(0, 7)}-01`

async function pickFirstOfMonth() {
  await userEvent.click(screen.getByLabelText('Planting date'))
  await userEvent.click(screen.getByRole('button', { name: formatDayName(firstOfMonth) }))
}

function renderForm(plantedOn: string | null = null) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PlantingForm journalId="j1" plantedOn={plantedOn} />
    </QueryClientProvider>,
  )
}

describe('PlantingForm', () => {
  it('starts on today and records it with one click', async () => {
    let body: unknown
    server.use(
      http.put(`${origin}/v1/journals/j1/planting`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({
          id: 'j1',
          order_id: 'o1',
          species: 'Basil',
          planted_on: todayIso(),
          created_at: '2026-11-01T10:00:00Z',
          checkpoints: [],
        })
      }),
    )
    renderForm()
    expect(screen.getByLabelText('Planting date')).toHaveTextContent(formatDate(todayIso()))
    await userEvent.click(screen.getByRole('button', { name: 'Record planting' }))

    await vi.waitFor(() => expect(body).toEqual({ planted_on: todayIso() }))
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
          planted_on: firstOfMonth,
          created_at: '2026-11-01T10:00:00Z',
          checkpoints: [],
        })
      }),
    )
    renderForm()
    await pickFirstOfMonth()
    await userEvent.click(screen.getByRole('button', { name: 'Record planting' }))

    await vi.waitFor(() => expect(body).toEqual({ planted_on: firstOfMonth }))
  })

  it('shows the server error next to the form', async () => {
    server.use(
      http.put(`${origin}/v1/journals/j1/planting`, () =>
        HttpResponse.json({ title: 'Not Found', status: 404 }, { status: 404 }),
      ),
    )
    renderForm()
    await pickFirstOfMonth()
    await userEvent.click(screen.getByRole('button', { name: 'Record planting' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('could not find')
  })

  it('shows a saved planting date as text that cannot be changed', () => {
    renderForm('2026-11-01')

    expect(screen.getByText('Nov 1, 2026')).toBeInTheDocument()
    expect(screen.getByText(/cannot be changed/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Planting date')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('explains a planting that was saved elsewhere in the meantime', async () => {
    server.use(
      http.put(`${origin}/v1/journals/j1/planting`, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, code: 'planting-already-recorded' },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderForm()
    await pickFirstOfMonth()
    await userEvent.click(screen.getByRole('button', { name: 'Record planting' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('already saved')
  })
})
