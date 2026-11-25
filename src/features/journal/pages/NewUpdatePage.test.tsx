import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import {
  answerLabels,
  dryDepthLabels,
  lightingLabels,
  potDiameterLabels,
  sensorUnitLabels,
  wateringMethodLabels,
} from '../model/labels'
import { formatDayName } from '@/shared/lib/calendar'
import { todayIso } from '../model/dates'
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

function feed(items: { id: string; last_watered_on: string | null }[] = []) {
  server.use(
    http.get(`${origin}/v1/journals/j1/updates`, () =>
      HttpResponse.json({ items, next_cursor: null }),
    ),
  )
}

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

const choose = (name: string) => userEvent.click(screen.getByRole('radio', { name }))
const chooseIn = (group: RegExp, name: string) =>
  userEvent.click(within(screen.getByRole('group', { name: group })).getByRole('radio', { name }))
const png = () => new File(['x'], 'p.png', { type: 'image/png' })

async function addPhotos() {
  await userEvent.upload(screen.getByLabelText(/Whole plant/), png())
}

/** The three-step upload and the diagnosis, recording what the page sent. */
function backend() {
  const calls: string[] = []
  const confirmed: string[] = []
  const sent: { update: Record<string, unknown> } = { update: {} }
  server.use(
    http.post(`${origin}/v1/journals/j1/updates`, async ({ request }) => {
      calls.push('update')
      sent.update = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ id: sent.update.id, journal_id: 'j1' }, { status: 201 })
    }),
    http.post(`${origin}/v1/updates/:id/photos`, async ({ request }) => {
      const { kind } = (await request.json()) as { kind: string }
      calls.push(`ticket:${kind}`)
      return HttpResponse.json({
        kind,
        upload_url: `${storage}/${kind}`,
        expires_in_seconds: 900,
        required_headers: { 'Content-Type': 'image/png', 'Content-Length': '1' },
      })
    }),
    http.put(`${storage}/:kind`, ({ params }) => {
      calls.push(`put:${String(params.kind)}`)
      return new HttpResponse(null, { status: 200 })
    }),
    http.post(`${origin}/v1/updates/:id/photos/:kind/confirm`, ({ params }) => {
      calls.push(`confirm:${String(params.kind)}`)
      confirmed.push(String(params.kind))
      return HttpResponse.json({ kind: params.kind, url: 'http://storage.test/read' })
    }),
    http.get(`${origin}/v1/updates/:id/photos`, () =>
      HttpResponse.json({
        photos: confirmed.map((kind) => ({ kind, url: 'http://storage.test/read' })),
      }),
    ),
    http.post(`${origin}/v1/updates/:id/diagnosis`, () => {
      calls.push('diagnosis')
      return HttpResponse.json({ status: 'completed', candidates: [] })
    }),
  )
  return { calls, sent }
}

// The first day of the current month is never in the future, whatever today is.
const firstOfMonth = `${todayIso().slice(0, 7)}-01`

describe('NewUpdatePage', () => {
  beforeEach(() => {
    feed()
    server.use(http.get(`${origin}/v1/me/entitlement`, () => HttpResponse.json(entitlement)))
  })

  it('shows the remaining AI checks beside the submit button', async () => {
    renderPage()
    expect(await screen.findByText(/Left today: 2 of 3/)).toBeInTheDocument()
  })

  it('needs only the lighting: photos are optional', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))

    expect(await screen.findByText('Choose the lighting')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /^Lighting/ })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByText(/Add this photo/)).not.toBeInTheDocument()
    expect(screen.getAllByText(/\(optional\)/).length).toBeGreaterThanOrEqual(3)
  })

  it('saves an update without photos and runs the diagnosis, no photo is required', async () => {
    const { calls } = backend()
    renderPage()
    await choose(lightingLabels.low)
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))

    expect(await screen.findByRole('heading', { name: 'Update page' })).toBeInTheDocument()
    expect(calls).toEqual(['update', 'diagnosis'])
  })

  it('sends no photo request for a photo that was chosen and then removed', async () => {
    const { calls } = backend()
    renderPage()
    await addPhotos()
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await choose(lightingLabels.low)
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))

    expect(await screen.findByRole('heading', { name: 'Update page' })).toBeInTheDocument()
    expect(calls).toEqual(['update', 'diagnosis'])
  })

  it('refuses a photo of a type the backend does not accept', async () => {
    renderPage()
    await choose(lightingLabels.low)
    await userEvent.upload(
      screen.getByLabelText(/Whole plant/),
      new File(['x'], 'p.gif', { type: 'image/gif' }),
      { applyAccept: false },
    )
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))

    expect(await screen.findByText('Use a JPEG, PNG or WebP photo.')).toBeInTheDocument()
  })

  it('sends "unknown" for every question left alone, uploads and confirms the photo, then diagnoses', async () => {
    const { calls, sent } = backend()
    renderPage()
    await choose(lightingLabels.bright_indirect)
    await addPhotos()
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))

    expect(await screen.findByRole('heading', { name: 'Update page' })).toBeInTheDocument()
    expect(calls).toEqual([
      'update',
      'ticket:overview',
      'put:overview',
      'confirm:overview',
      'diagnosis',
    ])
    expect(sent.update).toMatchObject({
      lighting: 'bright_indirect',
      last_watered_on: null,
      watering_method: 'unknown',
      pot_diameter_class: 'unknown',
      drainage_holes: 'unknown',
      standing_water_over_1h: 'unknown',
      dry_depth: 'unknown',
      pot_weight_relative: 'unknown',
      repotted_or_moved: null,
      sensor_reading: null,
    })
  })

  it('sends what was filled in', async () => {
    const { sent } = backend()
    renderPage()
    await choose(wateringMethodLabels.through_drainage)
    await choose(potDiameterLabels['10_15'])
    await chooseIn(/drainage holes/, answerLabels.yes)
    await choose(dryDepthLabels.about_5cm)
    await choose(lightingLabels.low)
    await userEvent.click(screen.getByText('Sensors (optional)'))
    await userEvent.type(screen.getByLabelText('Soil sensor reading'), '35.5')
    await choose(sensorUnitLabels.vwc_pct)
    await userEvent.type(screen.getByLabelText('Air temperature now, °C'), '22')
    await addPhotos()
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))

    await screen.findByRole('heading', { name: 'Update page' })
    expect(sent.update).toMatchObject({
      watering_method: 'through_drainage',
      pot_diameter_class: '10_15',
      drainage_holes: 'yes',
      dry_depth: 'about_5cm',
      lighting: 'low',
      sensor_reading: 35.5,
      sensor_unit: 'vwc_pct',
      air_temp_c: 22,
    })
    expect(typeof sent.update.air_measured_at).toBe('string')
  })

  it('asks whether the plant was watered since the date of the last update, and keeps that date for "no"', async () => {
    feed([{ id: 'p1', last_watered_on: '2026-11-01' }])
    const { sent } = backend()
    renderPage()

    expect(await screen.findByText('Did you water after Nov 1, 2026?')).toBeInTheDocument()
    expect(screen.queryByLabelText('Last watered')).not.toBeInTheDocument()
    await choose('No, not since then')
    await choose(lightingLabels.medium)
    await addPhotos()
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))

    await screen.findByRole('heading', { name: 'Update page' })
    expect(sent.update.last_watered_on).toBe('2026-11-01')
  })

  it('asks when the plant was watered after "yes"', async () => {
    feed([{ id: 'p1', last_watered_on: '2026-11-01' }])
    const { sent } = backend()
    renderPage()
    await screen.findByText('Did you water after Nov 1, 2026?')

    await chooseIn(/Did you water after/, 'Yes')
    await userEvent.click(screen.getByLabelText('When did you water last?'))
    await userEvent.click(screen.getByRole('button', { name: formatDayName(firstOfMonth) }))
    await choose(lightingLabels.medium)
    await addPhotos()
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))
    await screen.findByRole('heading', { name: 'Update page' })
    expect(sent.update.last_watered_on).toBe(firstOfMonth)
  })

  it('sends no watering date for "don\'t know", so the interval is not worked out', async () => {
    feed([{ id: 'p1', last_watered_on: '2026-11-01' }])
    const { sent } = backend()
    renderPage()
    await screen.findByText('Did you water after Nov 1, 2026?')

    await chooseIn(/Did you water after/, "Don't know")
    await choose(lightingLabels.medium)
    await addPhotos()
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))
    await screen.findByRole('heading', { name: 'Update page' })
    expect(sent.update.last_watered_on).toBeNull()
  })

  it('explains that partial watering is not counted', async () => {
    renderPage()
    expect(screen.queryByText(/not counted when the watering interval/)).not.toBeInTheDocument()
    await choose(wateringMethodLabels.partial)
    expect(screen.getByText(/not counted when the watering interval/)).toBeInTheDocument()
  })

  it('stresses the weight of the pot from 20 cm up, where it is the main sign', async () => {
    renderPage()
    expect(screen.queryByText(/most reliable sign/)).not.toBeInTheDocument()

    await choose(potDiameterLabels['20_30'])
    expect(screen.getByText(/most reliable sign/)).toBeInTheDocument()
    expect(screen.getByLabelText('Weight now, g')).toBeVisible()

    await choose(potDiameterLabels['15_20'])
    expect(screen.queryByText(/most reliable sign/)).not.toBeInTheDocument()
  })

  it('wants the unit of a sensor reading', async () => {
    renderPage()
    await choose(lightingLabels.low)
    await userEvent.click(screen.getByText('Sensors (optional)'))
    await userEvent.type(screen.getByLabelText('Soil sensor reading'), '30')
    await addPhotos()
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))

    expect(await screen.findByText('Choose the unit of the reading')).toBeInTheDocument()
  })

  it('explains a photo that did not reach the storage', async () => {
    backend()
    server.use(
      http.post(`${origin}/v1/updates/:id/photos/:kind/confirm`, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, code: 'photo-not-uploaded' },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderPage()
    await choose(lightingLabels.low)
    await addPhotos()
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('did not reach the storage')
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
    await choose(lightingLabels.low)
    await addPhotos()
    await userEvent.click(screen.getByRole('button', { name: 'Submit update' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('was not created')
    expect(alert).toHaveTextContent('Hobbyist')
    expect(screen.queryByRole('heading', { name: 'Update page' })).not.toBeInTheDocument()
  })
})
