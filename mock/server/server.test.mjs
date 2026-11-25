import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createMockServer } from './server.mjs'

let server
let base

beforeAll(async () => {
  server = createMockServer({ publicOrigin: 'http://mock.test' })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})

afterAll(() => new Promise((resolve) => server.close(resolve)))

async function call(method, path, { token, body, headers } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: token } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  return { status: response.status, body: text ? JSON.parse(text) : undefined }
}

async function signIn(email, password = 'anything') {
  const { status, body } = await call('POST', '/cognito', {
    body: {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: 'mock',
      AuthParameters: { USERNAME: email, PASSWORD: password },
    },
  })
  return { status, body, token: body.AuthenticationResult?.IdToken }
}

const answers = {
  lighting: 'bright_indirect',
  watering_method: 'through_drainage',
  pot_diameter_class: '15_20',
  drainage_holes: 'yes',
  standing_water_over_1h: 'no',
  dry_depth: 'about_2_3cm',
  pot_weight_relative: 'about_same',
}

describe('sign-in', () => {
  it('accepts a demo account with any password and puts the groups in the token', async () => {
    const admin = await signIn('admin@growpath.test')
    expect(admin.status).toBe(200)
    const payload = JSON.parse(Buffer.from(admin.token.split('.')[1], 'base64url').toString())
    expect(payload['cognito:groups']).toEqual(['admins'])
    expect(admin.body.AuthenticationResult.RefreshToken).toBeTruthy()
  })

  it('refuses an unknown user, an empty password and a disabled user', async () => {
    expect((await signIn('nobody@growpath.test')).body.__type).toBe('UserNotFoundException')
    expect((await signIn('customer@growpath.test', '')).body.__type).toBe('NotAuthorizedException')
    expect((await signIn('former.member@growpath.test')).body.message).toMatch(/disabled/)
  })

  it('refreshes the ID token', async () => {
    const first = await signIn('customer@growpath.test')
    const refreshed = await call('POST', '/cognito', {
      body: {
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: { REFRESH_TOKEN: first.body.AuthenticationResult.RefreshToken },
      },
    })
    expect(refreshed.body.AuthenticationResult.IdToken).toBeTruthy()
  })
})

describe('public reads and roles', () => {
  it('serves the shop and a plant profile without a token, and nothing else', async () => {
    const items = await call('GET', '/v1/items?limit=100')
    expect(items.body.items.length).toBeGreaterThan(10)
    expect(items.body.items[0]).toMatchObject({ currency: 'EUR', labels: expect.any(Array) })
    const plant = await call('GET', '/v1/plants/aloe-vera')
    expect(plant.body.faq.length).toBeGreaterThan(0)
    expect((await call('GET', '/v1/plants/nothing')).status).toBe(404)
    expect((await call('GET', '/v1/journals')).status).toBe(401)
  })

  it('tells the role through /v1/me and keeps the admin and expert areas apart', async () => {
    const customer = (await signIn('customer@growpath.test')).token
    const expert = (await signIn('expert@growpath.test')).token
    const admin = (await signIn('admin@growpath.test')).token
    expect((await call('GET', '/v1/me', { token: expert })).body.role).toBe('expert')
    expect((await call('GET', '/v1/admin/users', { token: customer })).status).toBe(403)
    expect((await call('GET', '/v1/expert/tickets', { token: admin })).status).toBe(403)
    expect((await call('GET', '/v1/expert/tickets', { token: expert })).body.items.length).toBe(2)
  })
})

describe('the customer journey', () => {
  it('orders a pack, plants it, updates it with a photo, gets a diagnosis and asks an expert', async () => {
    const { token } = await signIn('premium@growpath.test')
    const { body: shop } = await call('GET', '/v1/items?limit=100')
    const pack = shop.items.find((item) => item.slug === 'golden-pothos')

    const order = await call('POST', '/v1/orders', { token, body: { item_id: pack.id } })
    expect(order.status).toBe(201)
    expect(order.body.discount_cents).toBeGreaterThan(0)

    const { body: journals } = await call('GET', '/v1/journals', { token })
    const journal = journals.items[0]
    expect(journal).toMatchObject({ order_id: order.body.id, planted_on: null, checkpoints: [] })

    const today = new Date().toISOString().slice(0, 10)
    const planted = await call('PUT', `/v1/journals/${journal.id}/planting`, {
      token,
      body: { planted_on: today },
    })
    expect(planted.body.checkpoints[0].state).toBe('open')
    const again = await call('PUT', `/v1/journals/${journal.id}/planting`, {
      token,
      body: { planted_on: today },
    })
    expect(again.status).toBe(409)
    expect(again.body.code).toBe('planting-already-recorded')

    const updateId = crypto.randomUUID()
    const created = await call('POST', `/v1/journals/${journal.id}/updates`, {
      token,
      body: { id: updateId, ...answers, sensor_reading: 35.5, sensor_unit: 'vwc_pct' },
    })
    expect(created.status).toBe(201)
    expect(created.body.sensor_reading).toBe('35.5')

    expect((await call('POST', `/v1/updates/${updateId}/diagnosis`, { token })).status).toBe(422)

    const ticket = await call('POST', `/v1/updates/${updateId}/photos`, {
      token,
      body: { kind: 'overview', content_type: 'image/png', size_bytes: 4 },
    })
    expect(ticket.body.upload_url).toBe(`http://mock.test/mock-storage/${updateId}/overview`)
    expect(
      (await call('POST', `/v1/updates/${updateId}/photos/overview/confirm`, { token })).status,
    ).toBe(409)

    const put = await fetch(`${base}/mock-storage/${updateId}/overview`, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: new Uint8Array([1, 2, 3, 4]),
    })
    expect(put.status).toBe(200)
    expect(
      (await call('POST', `/v1/updates/${updateId}/photos/overview/confirm`, { token })).status,
    ).toBe(200)
    const photos = await call('GET', `/v1/updates/${updateId}/photos`, { token })
    expect(photos.body.missing_required).toEqual([])

    const diagnosis = await call('POST', `/v1/updates/${updateId}/diagnosis`, { token })
    expect(diagnosis.body.status).toBe('completed')

    const lowLight = crypto.randomUUID()
    await call('POST', `/v1/journals/${journal.id}/updates`, {
      token,
      body: { id: lowLight, ...answers, lighting: 'low' },
    })
    await fetch(`${base}/mock-storage/${lowLight}/overview`, {
      method: 'PUT',
      body: new Uint8Array([1]),
    })
    await call('POST', `/v1/updates/${lowLight}/photos/overview/confirm`, { token })
    const unsure = await call('POST', `/v1/updates/${lowLight}/diagnosis`, { token })
    expect(unsure.body).toMatchObject({ has_dominant_candidate: false, escalation_offered: true })

    const escalation = await call('POST', `/v1/updates/${lowLight}/escalation`, {
      token,
      body: { user_question: 'Is it the light?' },
    })
    expect(escalation.body.status).toBe('ticket_open')

    const expert = (await signIn('expert@growpath.test')).token
    const queue = await call('GET', '/v1/expert/tickets', { token: expert })
    expect(queue.body.items.length).toBe(3)
    const opened = queue.body.items.find((item) => item.species === 'Golden Pothos')
    const detail = await call('GET', `/v1/expert/tickets/${opened.id}`, { token: expert })
    expect(detail.body.context).toMatchObject({
      schema_version: 2,
      user_question: 'Is it the light?',
    })
    const answered = await call('POST', `/v1/expert/tickets/${opened.id}/answer`, {
      token: expert,
      body: { body: 'Move it to a brighter window.' },
    })
    expect(answered.body.status).toBe('answered')

    const seen = await call('GET', `/v1/updates/${lowLight}/escalation`, { token })
    expect(seen.body).toMatchObject({
      status: 'answered',
      answer_text: 'Move it to a brighter window.',
    })
  })

  it('asks one clarifying question when the dryness is unknown, then completes', async () => {
    const { token } = await signIn('customer@growpath.test')
    const journal = (await call('GET', '/v1/journals', { token })).body.items.find(
      (j) => j.planted_on,
    )
    const updateId = crypto.randomUUID()
    await call('POST', `/v1/journals/${journal.id}/updates`, {
      token,
      body: { id: updateId, ...answers, dry_depth: 'unknown' },
    })
    await fetch(`${base}/mock-storage/${updateId}/overview`, {
      method: 'PUT',
      body: new Uint8Array([1]),
    })
    await call('POST', `/v1/updates/${updateId}/photos/overview/confirm`, { token })
    const asked = await call('POST', `/v1/updates/${updateId}/diagnosis`, { token })
    expect(asked.body.status).toBe('awaiting_clarification')
    const done = await call('POST', `/v1/updates/${updateId}/diagnosis/clarification`, {
      token,
      body: { answer: 'Yes, dry at the bottom too.' },
    })
    expect(done.body.status).toBe('completed')
  })

  it('keeps a starter user from asking an expert', async () => {
    const { token } = await signIn('starter@growpath.test')
    const { body: shop } = await call('GET', '/v1/items?limit=100')
    await call('POST', '/v1/orders', {
      token,
      body: { item_id: shop.items.find((i) => i.item_type === 'pack').id },
    })
    const journal = (await call('GET', '/v1/journals', { token })).body.items[0]
    const updateId = crypto.randomUUID()
    await call('POST', `/v1/journals/${journal.id}/updates`, {
      token,
      body: { id: updateId, ...answers, lighting: 'low' },
    })
    const refused = await call('POST', `/v1/updates/${updateId}/escalation`, { token, body: {} })
    expect(refused.status).toBe(403)
    expect(
      (await call('GET', '/v1/me/entitlement', { token })).body.expert_quota_30_days.limit,
    ).toBe(0)
  })

  it('answers a care question from the knowledge base with sources, and declines other topics', async () => {
    const { token } = await signIn('customer@growpath.test')
    const journal = (await call('GET', '/v1/journals', { token })).body.items.find(
      (j) => j.planted_on,
    )
    const answered = await call('POST', `/v1/journals/${journal.id}/chat/turns`, {
      token,
      body: { id: crypto.randomUUID(), question: 'How much light does my monstera need?' },
    })
    expect(answered.body.outcome).toBe('answered')
    expect(answered.body.sources[0]).toMatchObject({ source_name: expect.any(String) })
    const off = await call('POST', `/v1/journals/${journal.id}/chat/turns`, {
      token,
      body: { id: crypto.randomUUID(), question: 'Who will be the next president?' },
    })
    expect(off.body.outcome).toBe('out_of_scope')
    const history = await call('GET', `/v1/journals/${journal.id}/chat/turns`, { token })
    expect(history.body.items.length).toBeGreaterThanOrEqual(3)
  })
})

describe('the administrator', () => {
  it('lists users in pages, creates one, changes the role and disables an account', async () => {
    const admin = (await signIn('admin@growpath.test')).token
    const first = await call('GET', '/v1/admin/users', { token: admin })
    expect(first.body.items.length).toBe(8)
    expect(first.body.next_cursor).toBeTruthy()
    const second = await call('GET', `/v1/admin/users?cursor=${first.body.next_cursor}`, {
      token: admin,
    })
    expect(second.body.items.length).toBeGreaterThan(0)

    const created = await call('POST', '/v1/admin/users', {
      token: admin,
      body: { email: 'new.expert@growpath.test', password: 'Secret-123', role: 'expert' },
    })
    expect(created.status).toBe(201)
    expect(
      (
        await call('POST', '/v1/admin/users', {
          token: admin,
          body: { email: 'new.expert@growpath.test', password: 'x', role: 'user' },
        })
      ).status,
    ).toBe(409)
    expect((await signIn('new.expert@growpath.test', 'wrong')).body.__type).toBe(
      'NotAuthorizedException',
    )
    expect((await signIn('new.expert@growpath.test', 'Secret-123')).status).toBe(200)

    const id = created.body.user_id
    expect(
      (await call('PUT', `/v1/admin/users/${id}/role`, { token: admin, body: { role: 'admin' } }))
        .body.role,
    ).toBe('admin')
    expect((await call('POST', `/v1/admin/users/${id}/disable`, { token: admin })).status).toBe(204)
    expect((await signIn('new.expert@growpath.test', 'Secret-123')).body.message).toMatch(
      /disabled/,
    )
    expect((await call('POST', `/v1/admin/users/${id}/enable`, { token: admin })).status).toBe(204)
    expect(
      (
        await call('POST', `/v1/admin/users/${id}/password`, {
          token: admin,
          body: { password: 'New-Pass-1' },
        })
      ).status,
    ).toBe(204)
  })
})
