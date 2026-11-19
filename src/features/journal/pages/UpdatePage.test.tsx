import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route, Routes } from 'react-router'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { UpdatePage } from './UpdatePage'

const origin = window.location.origin
const storage = 'http://storage.test/photo-key'
const update = {
  id: 'u1',
  journal_id: 'j1',
  created_at: '2026-11-19T10:00:00Z',
  last_watered_on: null,
  watering_interval_days: 3,
  drainage: 'poor',
  lighting: 'low',
  finger_test: 'wet',
  pot_weight: 'heavier',
  sensor_reading: null,
  diagnosis: null,
  escalation: null,
}
const server = setupServer()

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
      <MemoryRouter initialEntries={['/journals/j1/updates/u1']}>
        <Routes>
          <Route path="/journals/:journalId/updates/:updateId" element={<UpdatePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('UpdatePage', () => {
  it('shows the answers and the photos that are still required', async () => {
    server.use(
      http.get(`${origin}/v1/journals/j1/updates`, () =>
        HttpResponse.json({ items: [update], next_cursor: null }),
      ),
      http.get(`${origin}/v1/updates/u1/photos`, () =>
        HttpResponse.json({ photos: [], missing_required: ['overview', 'soil'] }),
      ),
    )
    renderPage()

    expect(await screen.findByText('Poor, water drains slowly')).toBeInTheDocument()
    expect(await screen.findByText('Still needed: Whole plant, Soil.')).toBeInTheDocument()
  })

  it('uploads a chosen photo to the presigned URL and refreshes the list', async () => {
    let uploaded = false
    let puts = 0
    server.use(
      http.get(`${origin}/v1/journals/j1/updates`, () =>
        HttpResponse.json({ items: [update], next_cursor: null }),
      ),
      http.get(`${origin}/v1/updates/u1/photos`, () =>
        HttpResponse.json(
          uploaded
            ? {
                photos: [{ kind: 'overview', url: 'http://storage.test/view' }],
                missing_required: ['soil'],
              }
            : { photos: [], missing_required: ['overview', 'soil'] },
        ),
      ),
      http.post(`${origin}/v1/updates/u1/photos`, () =>
        HttpResponse.json({ kind: 'overview', upload_url: storage, expires_in_seconds: 900 }),
      ),
      http.put(storage, () => {
        puts += 1
        uploaded = true
        return new HttpResponse(null, { status: 200 })
      }),
    )
    renderPage()

    const file = new File(['x'], 'plant.png', { type: 'image/png' })
    await userEvent.upload(await screen.findByLabelText('Whole plant'), file)

    expect(await screen.findByText('Still needed: Soil.')).toBeInTheDocument()
    expect(puts).toBe(1)
    expect(screen.getByAltText('Whole plant photo')).toBeInTheDocument()
  })

  it('rejects an unsupported file without calling the backend', async () => {
    server.use(
      http.get(`${origin}/v1/journals/j1/updates`, () =>
        HttpResponse.json({ items: [update], next_cursor: null }),
      ),
      http.get(`${origin}/v1/updates/u1/photos`, () =>
        HttpResponse.json({ photos: [], missing_required: ['overview', 'soil'] }),
      ),
    )
    renderPage()

    const user = userEvent.setup({ applyAccept: false })
    await user.upload(
      await screen.findByLabelText('Soil'),
      new File(['x'], 'notes.pdf', { type: 'application/pdf' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('JPEG, PNG or WebP')
  })

  it('says so when the update is not in the feed', async () => {
    server.use(
      http.get(`${origin}/v1/journals/j1/updates`, () =>
        HttpResponse.json({ items: [], next_cursor: null }),
      ),
    )
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('could not find')
  })
})
