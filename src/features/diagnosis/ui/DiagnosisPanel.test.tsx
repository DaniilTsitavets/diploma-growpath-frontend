import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import type { Diagnosis } from '../model/types'
import { DiagnosisPanel } from './DiagnosisPanel'

const origin = window.location.origin
const server = setupServer()

const base: Diagnosis = {
  status: 'completed',
  model_effort: 'low',
  has_dominant_candidate: true,
  clarifying_question: null,
  clarifying_answer: null,
  roots_photo_requested: false,
  watering: null,
  recommendation: 'Water less often.',
  escalation_offered: false,
  escalation_declined: false,
  update_id: 'u1',
  candidates: [
    { rank: 1, cause: 'Overwatering', rationale: 'The soil is wet and the pot is heavy.' },
    { rank: 2, cause: 'Low light', rationale: 'The plant is leaning.' },
  ],
}

const entitlement = {
  user_id: 'u',
  tier: 'starter',
  tier_expires_at: null,
  ai_quota_today: { used: 3, limit: 3 },
  expert_quota_30_days: { used: 0, limit: 0 },
}

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => 'token', onUnauthorized: () => undefined }))
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function show(diagnosis: Diagnosis) {
  server.use(
    http.get(`${origin}/v1/updates/u1/diagnosis`, () => HttpResponse.json(diagnosis)),
    http.get(`${origin}/v1/me/entitlement`, () => HttpResponse.json(entitlement)),
  )
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <DiagnosisPanel updateId="u1" journalId="j1" />
    </QueryClientProvider>,
  )
}

describe('DiagnosisPanel', () => {
  it('lists the ranked causes with their rationale and the recommendation', async () => {
    show(base)

    const list = await screen.findByRole('list', { name: /Possible causes/ })
    expect(list).toHaveTextContent('Overwatering')
    expect(list).toHaveTextContent('Low light')
    expect(screen.getByText('Water less often.')).toBeInTheDocument()
    expect(screen.getByText('There is a clear main cause.')).toBeInTheDocument()
  })

  it('says the cause is ambiguous and asks for the clarifying answer', async () => {
    show({
      ...base,
      status: 'awaiting_clarification',
      has_dominant_candidate: false,
      clarifying_question: 'How often do you water?',
      candidates: [],
    })

    expect(
      await screen.findByText(/The cause is ambiguous, so the AI needs one more detail/),
    ).toBeInTheDocument()
  })

  it('notes an ambiguous result among the causes', async () => {
    show({ ...base, has_dominant_candidate: false })
    expect(await screen.findByText('The cause is ambiguous.')).toBeInTheDocument()
  })

  it('asks the clarifying question and sends the answer for free', async () => {
    let answer: unknown
    server.use(
      http.post(`${origin}/v1/updates/u1/diagnosis/clarification`, async ({ request }) => {
        answer = await request.json()
        return HttpResponse.json(base)
      }),
    )
    show({
      ...base,
      status: 'awaiting_clarification',
      clarifying_question: 'How often do you water?',
      candidates: [],
    })

    await userEvent.type(await screen.findByLabelText('How often do you water?'), 'Every day')
    await userEvent.click(screen.getByRole('button', { name: 'Send answer' }))

    await vi.waitFor(() => expect(answer).toEqual({ answer: 'Every day' }))
    expect(screen.getByText(/does not use an AI check/)).toBeInTheDocument()
  })

  it('requires an answer before sending', async () => {
    show({ ...base, status: 'awaiting_clarification', clarifying_question: 'Why?', candidates: [] })
    await userEvent.click(await screen.findByRole('button', { name: 'Send answer' }))

    expect(await screen.findByText('Write your answer')).toBeInTheDocument()
  })

  it('explains a degraded result and offers an explicit retry', async () => {
    let retried = false
    server.use(
      http.post(`${origin}/v1/updates/u1/diagnosis`, () => {
        retried = true
        return HttpResponse.json(base)
      }),
    )
    show({ ...base, status: 'degraded', candidates: [], recommendation: 'Check the soil.' })

    expect(await screen.findByText(/Nothing was charged/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Retry diagnosis' }))
    await vi.waitFor(() => expect(retried).toBe(true))
  })

  it('names the next tier when a retry hits the exhausted AI quota', async () => {
    server.use(
      http.post(`${origin}/v1/updates/u1/diagnosis`, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, code: 'ai-quota-exhausted' },
          { status: 409 },
        ),
      ),
    )
    show({ ...base, status: 'degraded', candidates: [] })
    await userEvent.click(await screen.findByRole('button', { name: 'Retry diagnosis' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('AI checks for today are used up')
    expect(alert).toHaveTextContent('Hobbyist')
  })

  it('shows the watering assessment of a completed diagnosis', async () => {
    show({
      ...base,
      watering: {
        status: 'overwatering',
        reliability: 'high',
        depletion_D: 0.2,
        D_source: 'sensor',
        target_p: 0.5,
        p_source: 'profile',
        I_rec_days: 9,
        I_rec_bounds: { lower_days: 7, upper_days: 11, text: null },
        I_fact_days: 3,
        ratio_r: 0.3,
        Ks: 1,
        flags: ['drainage_none'],
        air: { T: 22, RH: 40, VPD_kPa: 1.2 },
        calibration: { n_observations: 2, reset_reason: null },
        assumptions: ['The pot holds 1 litre of water.'],
      },
    })

    expect(await screen.findByRole('heading', { name: 'Watering' })).toBeInTheDocument()
    expect(screen.getByText(/looks overwatered/)).toBeInTheDocument()
    expect(screen.getByText('Water every 7 to 11 days')).toBeInTheDocument()
    expect(screen.getByText('You water about every 3 days')).toBeInTheDocument()
    expect(screen.getByText(/no drainage holes/)).toBeInTheDocument()
    expect(screen.getByText(/Reliability of this estimate: High/)).toBeInTheDocument()
    expect(screen.getByText('The pot holds 1 litre of water.')).toBeInTheDocument()
  })

  it('shows no watering block for a diagnosis made before it existed', async () => {
    show(base)

    await screen.findByText('Overwatering')
    expect(screen.queryByRole('heading', { name: 'Watering' })).not.toBeInTheDocument()
  })
})
