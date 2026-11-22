import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { drainageLabels, fingerTestLabels, lightingLabels, potWeightLabels } from '../model/labels'
import { NewUpdatePage } from './NewUpdatePage'

const origin = window.location.origin
const storage = 'http://storage.test/photo'
const server = setupServer()

const entitlement = {
  user_id: 'u',
  tier: 'starter',
  tier_expires_at: null,
  ai_quota_today: { used: 1, limit: 3 },
  expert_quota_30_days: { used: 0, limit: 0 },
}

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

async function fillQuestionnaire() {
  await userEvent.click(screen.getByRole('radio', { name: drainageLabels.poor }))
  await userEvent.click(screen.getByRole('radio', { name: lightingLabels.low }))
  await userEvent.click(screen.getByRole('radio', { name: fingerTestLabels.wet }))
  await userEvent.click(screen.getByRole('radio', { name: potWeightLabels.heavier }))
}

const png = () => new File(['x'], 'p.png', { type: 'image/png' })

describe('NewUpdatePage', () => {
  beforeEach(() => {
    server.use(http.get(`${origin}/v1/me/entitlement`, () => HttpResponse.json(entitlement)))
  })

  it('shows the remaining AI checks beside the submit button', async () => {
    renderPage()
    expect(await screen.findByText(/Left today: 2 of 3/)).toBeInTheDocument()
  })

  it('shows an error for every unanswered field and missing required photo', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))

    expect(await screen.findAllByText('Choose an option')).toHaveLength(4)
    expect(screen.getByRole('group', { name: 'Drainage' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('requires both mandatory photos before sending anything', async () => {
    renderPage()
    await fillQuestionnaire()
    await userEvent.upload(screen.getByLabelText(/Whole plant/), png())
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))

    expect(await screen.findByText('Add this photo to continue.')).toBeInTheDocument()
  })

  it('saves the update, uploads the photos, runs the diagnosis and opens the update', async () => {
    const calls: string[] = []
    let body: Record<string, unknown> = {}
    server.use(
      http.post(`${origin}/v1/journals/j1/updates`, async ({ request }) => {
        calls.push('update')
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: body.id, journal_id: 'j1' }, { status: 201 })
      }),
      http.post(`${origin}/v1/updates/:id/photos`, async ({ request }) => {
        const { kind } = (await request.json()) as { kind: string }
        calls.push(`ticket:${kind}`)
        return HttpResponse.json({
          kind,
          upload_url: `${storage}/${kind}`,
          expires_in_seconds: 900,
        })
      }),
      http.put(`${storage}/:kind`, ({ params }) => {
        calls.push(`put:${String(params.kind)}`)
        return new HttpResponse(null, { status: 200 })
      }),
      http.post(`${origin}/v1/updates/:id/diagnosis`, () => {
        calls.push('diagnosis')
        return HttpResponse.json({ status: 'completed', candidates: [] })
      }),
    )
    renderPage()
    await fillQuestionnaire()
    await userEvent.upload(screen.getByLabelText(/Whole plant/), png())
    await userEvent.upload(screen.getByLabelText(/^Soil \(required\)/), png())
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))

    expect(await screen.findByRole('heading', { name: 'Update page' })).toBeInTheDocument()
    expect(calls).toEqual([
      'update',
      'ticket:overview',
      'put:overview',
      'ticket:soil',
      'put:soil',
      'diagnosis',
    ])
    expect(body).toMatchObject({ drainage: 'poor', watering_interval_days: null })
  })

  it('explains an exhausted AI quota and names the next tier', async () => {
    server.use(
      http.post(`${origin}/v1/journals/j1/updates`, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, code: 'ai-quota-exhausted' },
          { status: 409 },
        ),
      ),
    )
    renderPage()
    await screen.findByText(/Left today/)
    await fillQuestionnaire()
    await userEvent.upload(screen.getByLabelText(/Whole plant/), png())
    await userEvent.upload(screen.getByLabelText(/^Soil \(required\)/), png())
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('was not created')
    expect(alert).toHaveTextContent('Hobbyist')
    expect(screen.queryByRole('heading', { name: 'Update page' })).not.toBeInTheDocument()
  })
})
