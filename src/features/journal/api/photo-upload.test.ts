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
  HttpResponse.json({ kind: 'overview', upload_url: storage, expires_in_seconds: 900 }),
)
const photo = new File(['x'], 'p.png', { type: 'image/png' })

describe('uploadPhoto', () => {
  it('uploads the file to the presigned URL with its content type', async () => {
    let contentType: string | null = null
    server.use(
      ticket,
      http.put(storage, ({ request }) => {
        contentType = request.headers.get('Content-Type')
        return new HttpResponse(null, { status: 200 })
      }),
    )
    await uploadPhoto('u1', 'overview', photo)
    expect(contentType).toBe('image/png')
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
})
