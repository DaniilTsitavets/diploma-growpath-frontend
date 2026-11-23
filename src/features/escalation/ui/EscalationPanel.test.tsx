import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { Diagnosis } from '@/features/diagnosis/model/types'
import type { Entitlement } from '@/features/entitlement/model/types'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import type { Escalation } from '../model/types'
import { EscalationPanel } from './EscalationPanel'

const origin = window.location.origin
const server = setupServer()

const diagnosis: Diagnosis = {
  status: 'completed',
  model_effort: 'low',
  has_dominant_candidate: false,
  clarifying_question: null,
  clarifying_answer: null,
  roots_photo_requested: false,
  watering: null,
  recommendation: null,
  escalation_offered: true,
  escalation_declined: false,
  update_id: 'u1',
  candidates: [],
}

const entitlement = (tier: Entitlement['tier'], used: number, limit: number): Entitlement => ({
  user_id: 'u',
  tier,
  tier_expires_at: null,
  ai_quota_today: { used: 0, limit: 3 },
  expert_quota_30_days: { used, limit },
})

const escalation = (overrides: Partial<Escalation>): Escalation => ({
  id: 'e1',
  status: 'requested',
  answer_text: null,
  answered_at: null,
  created_at: '2026-11-19T10:00:00Z',
  update_id: 'u1',
  user_question: null,
  ...overrides,
})

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => 'token', onUnauthorized: () => undefined }))
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function show(options: {
  entitlement: Entitlement
  escalation?: Escalation | null
  diagnosis?: Diagnosis
}) {
  server.use(
    http.get(`${origin}/v1/updates/u1/escalation`, () =>
      options.escalation
        ? HttpResponse.json(options.escalation)
        : HttpResponse.json({ title: 'Not Found', status: 404 }, { status: 404 }),
    ),
    http.get(`${origin}/v1/updates/u1/diagnosis`, () =>
      HttpResponse.json(options.diagnosis ?? diagnosis),
    ),
    http.get(`${origin}/v1/me/entitlement`, () => HttpResponse.json(options.entitlement)),
  )
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <EscalationPanel updateId="u1" journalId="j1" />
    </QueryClientProvider>,
  )
}

describe('EscalationPanel', () => {
  it('blocks a Starter user and explains the plan with 0 of 0', async () => {
    show({ entitlement: entitlement('starter', 0, 0) })

    expect(await screen.findByText('Expert consultations left: 0 of 0')).toBeInTheDocument()
    expect(screen.getByText(/available from the Hobbyist plan/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ask an expert' })).toBeDisabled()
  })

  it('shows that declining the expert is free', async () => {
    show({ entitlement: entitlement('hobbyist', 0, 2) })
    expect(
      await screen.findByRole('button', { name: "Don't ask an expert (free)" }),
    ).toBeInTheDocument()
  })

  it('asks for confirmation naming the cost before spending a consultation', async () => {
    let body: unknown
    server.use(
      http.post(`${origin}/v1/updates/u1/escalation`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(escalation({}), { status: 201 })
      }),
    )
    show({ entitlement: entitlement('hobbyist', 0, 2) })

    await userEvent.type(await screen.findByLabelText(/Your question/), 'Is this root rot?')
    await userEvent.click(screen.getByRole('button', { name: 'Ask an expert' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('uses 1 of your 2 expert consultations (2 left)')
    expect(body).toBeUndefined()

    await userEvent.click(screen.getByRole('button', { name: 'Send to the expert' }))
    await vi.waitFor(() => expect(body).toEqual({ user_question: 'Is this root rot?' }))
  })

  it('requires a question when the AI did not offer an expert', async () => {
    show({
      entitlement: entitlement('hobbyist', 0, 2),
      diagnosis: { ...diagnosis, escalation_offered: false },
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Ask an expert' }))

    expect(await screen.findByText('Describe what you want to ask the expert')).toBeInTheDocument()
  })

  it('declines the offered expert without a dialog', async () => {
    let declined = false
    server.use(
      http.post(`${origin}/v1/updates/u1/diagnosis/escalation-decline`, () => {
        declined = true
        return HttpResponse.json({ ...diagnosis, escalation_declined: true })
      }),
    )
    show({ entitlement: entitlement('hobbyist', 0, 2) })
    await userEvent.click(await screen.findByRole('button', { name: "Don't ask an expert (free)" }))

    await vi.waitFor(() => expect(declined).toBe(true))
  })

  it('shows the waiting state and the expert answer', async () => {
    show({ entitlement: entitlement('hobbyist', 1, 2), escalation: escalation({}) })
    expect(await screen.findByText(/with an expert/)).toBeInTheDocument()
  })

  it('shows the written answer once it arrives', async () => {
    show({
      entitlement: entitlement('hobbyist', 1, 2),
      escalation: escalation({
        status: 'answered',
        answer_text: 'Repot into a pot with drainage.',
        answered_at: '2026-11-19T12:00:00Z',
      }),
    })
    expect(await screen.findByText('Repot into a pot with drainage.')).toBeInTheDocument()
  })
})
