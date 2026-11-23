import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { uploadPhoto } from './photo-upload'

const origin = window.location.origin
const storage = 'http://storage.test/growpath-photos/key'
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => 'token', onUnauthorized: () => undefined }))
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const ticket = http.post(`${origin}/v1/updates/u1/photos`, () =>
  HttpResponse.json({
    kind: 'overview',
    upload_url: storage,
    expires_in_seconds: 900,
    required_headers: { 'Content-Type': 'image/png', 'Content-Length': '1' },
  }),
)
const photo = new File(['x'], 'p.png', { type: 'image/png' })

describe('uploadPhoto', () => {
  it('declares the type and size, uploads with the required headers, then confirms', async () => {
    const calls: string[] = []
    let declared: unknown
    let contentType: string | null = null
    server.use(
      http.post(`${origin}/v1/updates/u1/photos`, async ({ request }) => {
        declared = await request.json()
        calls.push('ticket')
        return HttpResponse.json({
          kind: 'overview',
          upload_url: storage,
          expires_in_seconds: 900,
          required_headers: { 'Content-Type': 'image/png', 'Content-Length': '1' },
        })
      }),
      http.put(storage, ({ request }) => {
        contentType = request.headers.get('Content-Type')
        calls.push('put')
        return new HttpResponse(null, { status: 200 })
      }),
      http.post(`${origin}/v1/updates/u1/photos/overview/confirm`, () => {
        calls.push('confirm')
        return HttpResponse.json({ kind: 'overview', url: 'http://storage.test/read' })
      }),
    )
    await uploadPhoto('u1', 'overview', photo)

    expect(declared).toEqual({ kind: 'overview', content_type: 'image/png', size_bytes: 1 })
    expect(contentType).toBe('image/png')
    expect(calls).toEqual(['ticket', 'put', 'confirm'])
  })

  it('does not confirm a photo that was not uploaded', async () => {
    let confirmed = false
    server.use(
      ticket,
      http.put(storage, () => new HttpResponse(null, { status: 500 })),
      http.post(`${origin}/v1/updates/u1/photos/overview/confirm`, () => {
        confirmed = true
        return HttpResponse.json({})
      }),
    )
    await expect(uploadPhoto('u1', 'overview', photo)).rejects.toMatchObject({ status: 500 })
    expect(confirmed).toBe(false)
  })

  it('reports an expired link', async () => {
    server.use(
      ticket,
      http.put(storage, () => new HttpResponse(null, { status: 403 })),
    )
    await expect(uploadPhoto('u1', 'overview', photo)).rejects.toMatchObject({
      kind: 'forbidden',
      detail: expect.stringContaining('expired') as string,
    })
  })

  it('reports a network failure', async () => {
    server.use(
      ticket,
      http.put(storage, () => HttpResponse.error()),
    )
    await expect(uploadPhoto('u1', 'overview', photo)).rejects.toMatchObject({ kind: 'network' })
  })

  it('passes on a refusal of the confirmation, such as an object that never arrived', async () => {
    server.use(
      ticket,
      http.put(storage, () => new HttpResponse(null, { status: 200 })),
      http.post(`${origin}/v1/updates/u1/photos/overview/confirm`, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, code: 'photo-not-uploaded' },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    await expect(uploadPhoto('u1', 'overview', photo)).rejects.toMatchObject({
      status: 409,
      code: 'photo-not-uploaded',
    })
  })
})
