import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route, Routes } from 'react-router'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { TicketPage } from './TicketPage'

const origin = window.location.origin
const server = setupServer()
const hours = (n: number) => new Date(Date.now() + n * 3_600_000).toISOString()

const context = {
  schema_version: 1,
  species: 'Basil',
  update: {
    id: 'u1',
    created_at: '2026-11-19T10:00:00+00:00',
    last_watered_on: '2026-11-17',
    watering_interval_days: 3,
    drainage: 'poor',
    lighting: 'low',
    finger_test: 'wet',
    pot_weight: 'brand_new_value',
    sensor_reading: null,
  },
  photos: [{ kind: 'overview', storage_key: 'k' }],
  user_question: 'Is this root rot?',
  diagnosis: {
    status: 'completed',
    has_dominant_candidate: false,
    candidates: [{ rank: 1, cause: 'Overwatering', rationale: 'Wet soil.' }],
    recommendation: 'Let it dry.',
  },
  history: [],
}

const ticket = (overrides: Record<string, unknown> = {}) => ({
  id: 't1',
  status: 'open',
  created_at: hours(-5),
  expires_at: hours(60),
  answered_at: null,
  cancelled_at: null,
  context,
  photos: [{ kind: 'overview', url: 'http://storage.test/overview' }],
  answer_text: null,
  ...overrides,
})

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => 'token', onUnauthorized: () => undefined }))
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function show(data: Record<string, unknown>) {
  server.use(http.get(`${origin}/v1/expert/tickets/t1`, () => HttpResponse.json(data)))
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/expert/tickets/t1']}>
        <Routes>
          <Route path="/expert/tickets/:ticketId" element={<TicketPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TicketPage', () => {
  it('shows the question first, then the AI view and the answers, with the photos beside', async () => {
    show(ticket())

    expect(await screen.findByRole('heading', { name: 'Basil' })).toBeInTheDocument()
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings.slice(0, 3)).toEqual([
      "The user's question",
      'What the AI found',
      "The user's answers",
    ])
    expect(screen.getByText('Is this root rot?')).toBeInTheDocument()
    expect(screen.getByText('Poor, water drains slowly')).toBeInTheDocument()
    expect(screen.getByAltText('Whole plant photo from the user')).toHaveAttribute(
      'src',
      'http://storage.test/overview',
    )
  })

  it('keeps an unknown enum value as it is', async () => {
    show(ticket())
    expect(await screen.findByText('brand_new_value')).toBeInTheDocument()
  })

  it('skips the blocks that are not in the context', async () => {
    show(ticket({ context: { schema_version: 1, species: 'Mint', update: { id: 'u' } } }))

    expect(await screen.findByRole('heading', { name: 'Mint' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: "The user's question" })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'What the AI found' })).not.toBeInTheDocument()
  })

  it('warns about a newer context version without failing', async () => {
    show(ticket({ context: { ...context, schema_version: 2 } }))

    expect(await screen.findByRole('note')).toHaveTextContent('newer data format')
    expect(screen.getByRole('heading', { name: 'Basil' })).toBeInTheDocument()
  })

  it('sends one written answer', async () => {
    let body: unknown
    server.use(
      http.post(`${origin}/v1/expert/tickets/t1/answer`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(
          { ticket_id: 't1', status: 'answered', answered_at: hours(0), answer_text: 'Repot it.' },
          { status: 201 },
        )
      }),
    )
    show(ticket())
    await userEvent.type(await screen.findByLabelText('Your written answer'), 'Repot it.')
    await userEvent.click(screen.getByRole('button', { name: 'Send answer' }))

    await vi.waitFor(() => expect(body).toEqual({ body: 'Repot it.' }))
  })

  it('requires an answer before sending', async () => {
    show(ticket())
    await userEvent.click(await screen.findByRole('button', { name: 'Send answer' }))

    expect(await screen.findByText('Write your answer')).toBeInTheDocument()
  })

  it('explains that another expert already answered', async () => {
    server.use(
      http.post(`${origin}/v1/expert/tickets/t1/answer`, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, code: 'ticket-already-answered' },
          { status: 409 },
        ),
      ),
    )
    show(ticket())
    await userEvent.type(await screen.findByLabelText('Your written answer'), 'Repot it.')
    await userEvent.click(screen.getByRole('button', { name: 'Send answer' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Another expert already answered')
  })

  it('explains that the ticket expired', async () => {
    server.use(
      http.post(`${origin}/v1/expert/tickets/t1/answer`, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, code: 'ticket-expired' },
          { status: 409 },
        ),
      ),
    )
    show(ticket())
    await userEvent.type(await screen.findByLabelText('Your written answer'), 'Repot it.')
    await userEvent.click(screen.getByRole('button', { name: 'Send answer' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('expired before it was answered')
  })

  it('shows the stored answer of an answered ticket and no form', async () => {
    show(ticket({ status: 'answered', answered_at: hours(-1), answer_text: 'Repot it.' }))

    const heading = await screen.findByRole('heading', { name: 'Answer' })
    const section = heading.closest('section') as HTMLElement
    expect(within(section).getByText('Repot it.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send answer' })).not.toBeInTheDocument()
  })

  it('says an expired ticket can no longer be answered', async () => {
    show(ticket({ status: 'cancelled', cancelled_at: hours(-1) }))

    expect(await screen.findByText(/Expired without an answer/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send answer' })).not.toBeInTheDocument()
  })
})
