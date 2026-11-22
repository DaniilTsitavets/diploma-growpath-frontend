import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route, Routes } from 'react-router'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import type { ChatTurn } from '../model/types'
import { JournalChatPage } from './JournalChatPage'

const origin = window.location.origin
const server = setupServer()

const source = {
  rank: 1,
  section_id: 's1',
  document_title: 'Watering basil',
  section_heading: 'How often',
  source_url: 'https://example.org/basil#water',
}

const turn = (overrides: Partial<ChatTurn>): ChatTurn => ({
  id: 't1',
  journal_id: 'j1',
  question: 'How often should I water basil?',
  outcome: 'answered',
  answer: 'Water when the top centimetre of soil is dry.',
  model_effort: 'low',
  created_at: '2026-11-20T10:00:00Z',
  sources: [source],
  related: [],
  ...overrides,
})

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => 'token', onUnauthorized: () => undefined }))
})
beforeEach(() => {
  server.use(
    http.get(`${origin}/v1/journals/j1`, () =>
      HttpResponse.json({
        id: 'j1',
        order_id: 'o1',
        species: 'Basil',
        planted_on: null,
        created_at: '2026-11-01T10:00:00Z',
        checkpoints: [],
      }),
    ),
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
      <MemoryRouter initialEntries={['/journals/j1/chat']}>
        <Routes>
          <Route path="/journals/:journalId/chat" element={<JournalChatPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function history(items: ChatTurn[]) {
  server.use(
    http.get(`${origin}/v1/journals/j1/chat/turns`, () =>
      HttpResponse.json({ items, next_cursor: null }),
    ),
  )
}

describe('JournalChatPage', () => {
  it('shows the stored conversation oldest first with source links', async () => {
    history([
      turn({ id: 't2', question: 'And light?', answer: 'Bright, indirect.' }),
      turn({ id: 't1' }),
    ])
    renderPage()

    const questions = await screen.findAllByText(/\?$/)
    expect(questions.map((q) => q.textContent)).toEqual([
      'How often should I water basil?',
      'And light?',
    ])
    expect(screen.getAllByRole('link', { name: 'Watering basil: How often' })[0]).toHaveAttribute(
      'href',
      'https://example.org/basil#water',
    )
  })

  it('greets the user when there are no questions and shows the AI checks left', async () => {
    history([])
    renderPage()

    expect(await screen.findByText(/Hi! Ask me anything about your Basil/)).toBeInTheDocument()
    expect(await screen.findByText(/Left today: 2 of 3/)).toBeInTheDocument()
  })

  it('requires a question before sending', async () => {
    history([])
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Send question' }))

    expect(await screen.findByText('Write your question')).toBeInTheDocument()
  })

  it('sends a question with an id and shows the answer', async () => {
    let body: Record<string, unknown> = {}
    let stored: ChatTurn[] = []
    server.use(
      http.get(`${origin}/v1/journals/j1/chat/turns`, () =>
        HttpResponse.json({ items: stored, next_cursor: null }),
      ),
      http.post(`${origin}/v1/journals/j1/chat/turns`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        stored = [turn({ id: String(body.id), question: String(body.question) })]
        return HttpResponse.json(stored[0], { status: 201 })
      }),
    )
    renderPage()
    await userEvent.type(
      await screen.findByLabelText('Your question'),
      'How often should I water basil?',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Send question' }))

    expect(
      await screen.findByText('Water when the top centimetre of soil is dry.'),
    ).toBeInTheDocument()
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(screen.getByLabelText('Your question')).toHaveValue('')
  })

  it('sends on Enter and keeps a new line on Shift+Enter', async () => {
    const questions: string[] = []
    history([])
    server.use(
      http.post(`${origin}/v1/journals/j1/chat/turns`, async ({ request }) => {
        const body = (await request.json()) as { id: string; question: string }
        questions.push(body.question)
        return HttpResponse.json(turn({ id: body.id, question: body.question }), { status: 201 })
      }),
    )
    renderPage()
    const input = await screen.findByLabelText('Your question')
    await userEvent.type(input, 'First line{Shift>}{Enter}{/Shift}second line{Enter}')

    await vi.waitFor(() => expect(questions).toEqual(['First line\nsecond line']))
  })

  it('explains a question outside plant care', async () => {
    history([turn({ outcome: 'out_of_scope', answer: null, sources: [] })])
    renderPage()

    expect(await screen.findByText(/not about plant care/)).toBeInTheDocument()
  })

  it('shows matching sections without an answer and reuses the id for a retry', async () => {
    const ids: string[] = []
    history([])
    server.use(
      http.post(`${origin}/v1/journals/j1/chat/turns`, async ({ request }) => {
        const { id } = (await request.json()) as { id: string }
        ids.push(id)
        return HttpResponse.json(
          turn({
            id,
            outcome: 'sources_only',
            answer: null,
            sources: [],
            related: [
              {
                section_id: 's9',
                document_title: 'Watering basil',
                section_heading: 'How often',
                source_url: 'https://example.org/basil',
                body: 'Let the top layer dry.',
              },
            ],
          }),
          { status: 200 },
        )
      }),
    )
    renderPage()
    await userEvent.type(await screen.findByLabelText('Your question'), 'Water?')
    await userEvent.click(screen.getByRole('button', { name: 'Send question' }))
    expect(await screen.findByText(/Nothing was charged/)).toBeInTheDocument()
    expect(screen.getByText('Let the top layer dry.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Send question' }))
    await vi.waitFor(() => expect(ids).toHaveLength(2))
    expect(ids[1]).toBe(ids[0])
  })

  it('names the next plan when the AI quota is exhausted', async () => {
    history([])
    server.use(
      http.post(`${origin}/v1/journals/j1/chat/turns`, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, code: 'ai-quota-exhausted' },
          { status: 409 },
        ),
      ),
    )
    renderPage()
    await userEvent.type(await screen.findByLabelText('Your question'), 'Water?')
    await userEvent.click(screen.getByRole('button', { name: 'Send question' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('question was not sent')
    expect(alert).toHaveTextContent('Hobbyist')
  })
})
