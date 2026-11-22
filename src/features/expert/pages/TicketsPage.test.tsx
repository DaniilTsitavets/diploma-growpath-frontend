import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter } from 'react-router'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { TicketsPage } from './TicketsPage'

const origin = window.location.origin
const server = setupServer()
const hours = (n: number) => new Date(Date.now() + n * 3_600_000).toISOString()

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
        <TicketsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TicketsPage', () => {
  it('lists open tickets with the time left and links to each one', async () => {
    server.use(
      http.get(`${origin}/v1/expert/tickets`, () =>
        HttpResponse.json({
          items: [
            { id: 't1', species: 'Basil', created_at: hours(-60), expires_at: hours(12) },
            { id: 't2', species: null, created_at: hours(-2), expires_at: hours(70) },
          ],
          next_cursor: null,
        }),
      ),
    )
    renderPage()

    const link = await screen.findByRole('link', { name: 'Basil' })
    expect(link).toHaveAttribute('href', '/expert/tickets/t1')
    expect(screen.getByRole('link', { name: 'Unknown plant' })).toBeInTheDocument()
    expect(screen.getByText(/11 h|12 h/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show more tickets' })).not.toBeInTheDocument()
  })

  it('pages through the queue with the cursor', async () => {
    const afters: (string | null)[] = []
    server.use(
      http.get(`${origin}/v1/expert/tickets`, ({ request }) => {
        const after = new URL(request.url).searchParams.get('after')
        afters.push(after)
        return HttpResponse.json(
          after
            ? {
                items: [
                  { id: 't2', species: 'Mint', created_at: hours(-1), expires_at: hours(60) },
                ],
                next_cursor: null,
              }
            : {
                items: [
                  { id: 't1', species: 'Basil', created_at: hours(-1), expires_at: hours(30) },
                ],
                next_cursor: 'c1',
              },
        )
      }),
    )
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Show more tickets' }))

    expect(await screen.findByRole('link', { name: 'Mint' })).toBeInTheDocument()
    expect(afters).toEqual([null, 'c1'])
  })

  it('says so when the queue is empty', async () => {
    server.use(
      http.get(`${origin}/v1/expert/tickets`, () =>
        HttpResponse.json({ items: [], next_cursor: null }),
      ),
    )
    renderPage()
    expect(await screen.findByText(/No open tickets/)).toBeInTheDocument()
  })

  it('shows a clear message for a user outside the experts group', async () => {
    server.use(
      http.get(`${origin}/v1/expert/tickets`, () =>
        HttpResponse.json({ title: 'Forbidden', status: 403 }, { status: 403 }),
      ),
    )
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('do not have access')
  })
})
