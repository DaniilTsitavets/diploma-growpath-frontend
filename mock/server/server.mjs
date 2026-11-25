// A stand-in for the GrowPath backend, so the frontend can be run and tested alone.
// It speaks the same contracts (contracts/openapi in the backend repository), keeps its state in memory and
// starts again from the seed below. It also plays Cognito (InitiateAuth) and the presigned photo storage.
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { readFileSync, existsSync, createReadStream } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, normalize } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const readJson = (name) => JSON.parse(readFileSync(join(here, 'data', name), 'utf8'))

const ITEMS = readJson('items.json')
const PLANTS = readJson('plants.json')
const KB = readJson('kb-sections.json')

const DAY = 24 * 60 * 60 * 1000
const PAGE_SIZE = 8

/** Demo accounts: any password is accepted for them, nothing has to exist in Cognito. */
const SEED_USERS = [
  { email: 'customer@growpath.test', role: 'user', tier: 'hobbyist' },
  { email: 'starter@growpath.test', role: 'user', tier: 'starter' },
  { email: 'premium@growpath.test', role: 'user', tier: 'premium' },
  { email: 'expert@growpath.test', role: 'expert' },
  { email: 'admin@growpath.test', role: 'admin' },
]

const LIMITS = {
  starter: { ai: 3, expert: 0 },
  hobbyist: { ai: 10, expert: 1 },
  premium: { ai: 30, expert: 4 },
}

const REQUIRED_PHOTOS = ['overview']
const PHOTO_KINDS = ['overview', 'soil', 'symptom_closeup', 'roots_drainage']

const iso = (ms) => new Date(ms).toISOString()
const day = (ms) => iso(ms).slice(0, 10)
const addDays = (date, n) => day(Date.parse(`${date}T00:00:00Z`) + n * DAY)
const id = () => randomUUID()

export function createMockServer({ publicOrigin } = {}) {
  const now = () => Date.now()

  const users = new Map()
  const addUser = (email, role, extra = {}) => {
    const user = {
      user_id: id(),
      email,
      role,
      enabled: true,
      created_at: iso(now() - 40 * DAY),
      password: null,
      tier: 'starter',
      ...extra,
    }
    users.set(user.user_id, user)
    return user
  }
  for (const seed of SEED_USERS) addUser(seed.email, seed.role, { tier: seed.tier ?? 'starter' })
  for (let n = 1; n <= 9; n += 1) addUser(`student${n}@growpath.test`, 'user', { tier: 'starter' })
  addUser('former.member@growpath.test', 'user', { enabled: false })
  const customer = [...users.values()].find((u) => u.email === 'customer@growpath.test')

  const state = {
    orders: [],
    journals: [],
    updates: [],
    uploads: new Map(),
    confirmed: new Map(),
    diagnoses: new Map(),
    escalations: new Map(),
    tickets: [],
    chat: [],
    usage: new Map(),
  }

  const itemBySlug = (slug) => ITEMS.find((item) => item.slug === slug)
  const plantBySlug = (slug) => PLANTS.find((plant) => plant.slug === slug)

  // ---------------------------------------------------------------- journals

  function checkpointsFor(plantedOn) {
    if (!plantedOn) return []
    const today = day(now())
    return [1, 2, 3, 4].map((number) => {
      const opens = addDays(plantedOn, 7 * (number - 1))
      const closes = addDays(opens, 6)
      const state = today < opens ? 'upcoming' : today > closes ? 'passed' : 'open'
      return { number, opens_on: opens, closes_on: closes, state }
    })
  }

  function journalResponse(journal) {
    return {
      id: journal.id,
      order_id: journal.order_id,
      species: journal.species,
      planted_on: journal.planted_on,
      created_at: journal.created_at,
      checkpoints: checkpointsFor(journal.planted_on),
    }
  }

  function placeOrder(user, item) {
    const first = !state.orders.some((order) => order.user_id === user.user_id)
    const pct = first && item.first_purchase_discount_pct ? item.first_purchase_discount_pct : 0
    const discount = Math.round((item.price_cents * pct) / 100)
    const order = {
      id: id(),
      user_id: user.user_id,
      item_id: item.id,
      list_price_cents: item.price_cents,
      discount_cents: discount,
      total_paid_cents: item.price_cents - discount,
      currency: 'EUR',
      placed_at: iso(now()),
    }
    state.orders.push(order)
    if (item.item_type === 'pack') {
      state.journals.push({
        id: id(),
        user_id: user.user_id,
        order_id: order.id,
        species: item.plant_species ?? item.name,
        plant_slug: item.plant_slug,
        planted_on: null,
        created_at: order.placed_at,
      })
    }
    return order
  }

  // ----------------------------------------------------------------- updates

  const text = (value) => (value === undefined || value === null ? null : String(value))

  function updateResponse(update) {
    const diagnosis = state.diagnoses.get(update.id)
    const escalation = state.escalations.get(update.id)
    return {
      id: update.id,
      journal_id: update.journal_id,
      created_at: update.created_at,
      lighting: update.lighting,
      last_watered_on: update.last_watered_on ?? null,
      watering_method: update.watering_method,
      pot_diameter_class: update.pot_diameter_class,
      drainage_holes: update.drainage_holes,
      standing_water_over_1h: update.standing_water_over_1h,
      dry_depth: update.dry_depth,
      pot_weight_relative: update.pot_weight_relative,
      pot_weight_after_watering_g: text(update.pot_weight_after_watering_g),
      pot_weight_now_g: text(update.pot_weight_now_g),
      repotted_or_moved: update.repotted_or_moved ?? null,
      sensor_reading: text(update.sensor_reading),
      sensor_unit: update.sensor_unit ?? null,
      air_temp_c: text(update.air_temp_c),
      air_rh_pct: text(update.air_rh_pct),
      air_measured_at: update.air_measured_at ?? null,
      air_temp_min_c: text(update.air_temp_min_c),
      air_temp_max_c: text(update.air_temp_max_c),
      air_rh_min_pct: text(update.air_rh_min_pct),
      air_rh_max_pct: text(update.air_rh_max_pct),
      diagnosis: diagnosis ? diagnosisSummary(diagnosis) : null,
      escalation: escalation ? escalationSummary(escalation) : null,
    }
  }

  const diagnosisSummary = ({ candidates: _candidates, update_id: _updateId, ...rest }) => rest

  const escalationSummary = ({ update_id: _updateId, user_question: _question, ...rest }) => rest

  // --------------------------------------------------------------- diagnosis

  const airContext = { T: null, RH: null, VPD_kPa: null }

  function watering(status, overrides = {}) {
    return {
      status,
      reliability: 'medium',
      depletion_D: null,
      D_source: 'depth',
      target_p: 0.5,
      p_source: 'profile',
      I_rec_days: null,
      I_rec_bounds: null,
      I_fact_days: null,
      ratio_r: null,
      Ks: null,
      flags: [],
      air: airContext,
      calibration: { n_observations: 1, reset_reason: null },
      assumptions: [],
      ...overrides,
    }
  }

  /** Decides from the questionnaire; the same answers always give the same result. */
  function diagnose(update, clarification) {
    const base = {
      model_effort: 'medium',
      clarifying_question: null,
      clarifying_answer: clarification ?? null,
      roots_photo_requested: false,
      escalation_offered: false,
      escalation_declined: false,
      update_id: update.id,
    }
    const done = (fields) => ({ ...base, status: 'completed', ...fields })

    if (update.dry_depth === 'unknown' && !clarification) {
      return {
        ...base,
        status: 'awaiting_clarification',
        has_dominant_candidate: null,
        clarifying_question:
          'Is the soil at the bottom of the pot also dry? Push a finger down towards the drainage holes.',
        recommendation: null,
        watering: null,
        candidates: [],
      }
    }

    const wet =
      update.standing_water_over_1h === 'yes' ||
      (update.dry_depth === 'not_dry' && update.pot_weight_relative === 'about_same')
    const dry =
      update.dry_depth === 'whole_root_ball_dry' || update.pot_weight_relative === 'very_light'
    if (wet) {
      return done({
        has_dominant_candidate: true,
        roots_photo_requested: update.standing_water_over_1h === 'yes',
        recommendation:
          'Let the top 2-3 cm of soil dry out before watering again, and empty the saucer after each watering.',
        watering: watering('overwatering', {
          reliability: 'medium',
          depletion_D: 0.12,
          I_rec_days: 9,
          I_rec_bounds: { lower_days: 7, upper_days: 11, text: null },
          I_fact_days: 3,
          ratio_r: 0.33,
          Ks: 1,
          flags: update.drainage_holes === 'no' ? ['drainage_none'] : [],
          assumptions: ['The pot is in its usual spot.'],
        }),
        candidates: [
          {
            rank: 1,
            cause: 'Overwatering',
            rationale:
              'The soil stays wet and the pot feels heavy, so the roots get too little air.',
          },
          {
            rank: 2,
            cause: 'Poor drainage',
            rationale: 'Water stands in the pot after watering, which keeps the root zone wet.',
          },
          {
            rank: 3,
            cause: 'Early root rot',
            rationale:
              'Constant wetness can start root rot; the photo of the roots would settle it.',
          },
        ],
      })
    }
    if (dry) {
      return done({
        has_dominant_candidate: true,
        recommendation:
          'Water thoroughly until it runs out of the holes, then check again in a week.',
        watering: watering('underwatering', {
          reliability: 'high',
          depletion_D: 0.82,
          I_rec_days: 8,
          I_rec_bounds: { lower_days: 7, upper_days: 10, text: null },
          I_fact_days: 16,
          ratio_r: 2,
          Ks: 0.6,
          assumptions: [],
        }),
        candidates: [
          {
            rank: 1,
            cause: 'Underwatering',
            rationale: 'The whole root ball is dry and the pot is very light.',
          },
          {
            rank: 2,
            cause: 'Hydrophobic soil',
            rationale: 'Dry peat can repel water; soaking the pot from below helps.',
          },
        ],
      })
    }
    if (update.lighting === 'low') {
      return done({
        has_dominant_candidate: false,
        escalation_offered: true,
        recommendation:
          'Move the plant closer to a window and water only when the top soil is dry.',
        watering: watering('unclear', {
          reliability: 'low',
          flags: ['low_light_vs_species'],
          assumptions: ['The light is lower than the species likes.'],
        }),
        candidates: [
          {
            rank: 1,
            cause: 'Too little light',
            rationale: 'Growth is slow and the soil dries slowly in low light.',
          },
          {
            rank: 2,
            cause: 'Overwatering',
            rationale: 'Low light and a regular watering rhythm can leave the soil wet for long.',
          },
        ],
      })
    }
    return done({
      has_dominant_candidate: true,
      recommendation: 'No problem found. Keep watering when the top 2-3 cm of soil is dry.',
      watering: watering('on_track', {
        reliability: 'medium',
        I_rec_days: 8,
        I_rec_bounds: { lower_days: 7, upper_days: 10, text: null },
        I_fact_days: 8,
        ratio_r: 1,
        Ks: 1,
      }),
      candidates: [
        {
          rank: 1,
          cause: 'Normal growth',
          rationale: 'The answers describe a plant that is watered about as often as it needs.',
        },
      ],
    })
  }

  function useAi(user) {
    const key = `${user.user_id}:ai:${day(now())}`
    state.usage.set(key, (state.usage.get(key) ?? 0) + 1)
  }

  function entitlement(user) {
    const limits = LIMITS[user.tier] ?? LIMITS.starter
    const aiUsed = state.usage.get(`${user.user_id}:ai:${day(now())}`) ?? 0
    const expertUsed = state.usage.get(`${user.user_id}:expert`) ?? 0
    return {
      user_id: user.user_id,
      tier: user.tier,
      tier_expires_at: null,
      ai_quota_today: { used: aiUsed, limit: limits.ai },
      expert_quota_30_days: { used: expertUsed, limit: limits.expert },
    }
  }

  // ------------------------------------------------------------------- chat

  const STOP = new Set(
    'a an and are as at be by can do does for from how i in is it my of on or should the to what when where which why with you your'.split(
      ' ',
    ),
  )
  const words = (value) =>
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 2 && !STOP.has(word))

  const OFF_TOPIC = /\b(weather|stock|bitcoin|president|football|recipe|movie|politic)/i

  function answerQuestion(journal, question) {
    if (OFF_TOPIC.test(question)) return { outcome: 'out_of_scope', answer: null, sources: [] }
    const asked = new Set(words(question))
    const species = journal.species.toLowerCase()
    const scored = KB.map((section) => {
      const own = (section.species ?? '').toLowerCase() === species
      const tokens = words(`${section.section_heading} ${section.body}`)
      const hits = tokens.filter((token) => asked.has(token)).length
      const heading = words(section.section_heading).filter((token) => asked.has(token)).length
      return { section, score: own || !section.species ? hits + heading * 8 : 0 }
    })
      .filter((entry) => entry.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
    if (scored.length === 0) return { outcome: 'not_in_kb', answer: null, sources: [] }

    const best = scored[0].section
    const sentences = best.body
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => sentence.length > 20)
    const answer = sentences.slice(0, 2).join(' ') || best.body.slice(0, 280)
    return {
      outcome: 'answered',
      answer,
      sources: scored.map(({ section }, index) => ({
        rank: index + 1,
        section_id: section.section_id,
        document_title: section.document_title,
        section_heading: section.section_heading,
        source_url: section.source_url,
        source_name: section.source_name,
        license: section.license ?? null,
      })),
    }
  }

  // ------------------------------------------------------------------ seed

  function seedDemoData() {
    const monstera = itemBySlug('monstera-deliciosa')
    const jade = itemBySlug('jade-plant')
    if (!monstera || !jade) return
    const first = placeOrder(customer, monstera)
    first.placed_at = iso(now() - 14 * DAY)
    const journal = state.journals.find((j) => j.order_id === first.id)
    journal.created_at = first.placed_at
    journal.planted_on = day(now() - 12 * DAY)
    placeOrder(customer, jade)

    const submitted = {
      id: id(),
      journal_id: journal.id,
      created_at: iso(now() - 5 * DAY),
      lighting: 'bright_indirect',
      last_watered_on: day(now() - 8 * DAY),
      watering_method: 'through_drainage',
      pot_diameter_class: '15_20',
      drainage_holes: 'yes',
      standing_water_over_1h: 'no',
      dry_depth: 'about_5cm',
      pot_weight_relative: 'noticeably_lighter',
      sensor_reading: '35.5',
      sensor_unit: 'vwc_pct',
    }
    state.updates.push(submitted)
    state.confirmed.set(
      submitted.id,
      new Map([['overview', { path: '/media/monstera-deliciosa.webp' }]]),
    )
    state.diagnoses.set(submitted.id, diagnose(submitted))
    state.chat.push({
      id: id(),
      journal_id: journal.id,
      question: 'How often should I water my monstera?',
      created_at: iso(now() - 4 * DAY),
      ...answerQuestion(journal, 'How often should I water my monstera watering'),
      related: [],
      model_effort: 'medium',
    })

    const queue = [
      {
        species: 'Peace Lily',
        question: 'The leaf tips turn brown even though I water regularly.',
        hours: 5,
      },
      { species: 'Snake Plant', question: 'Is the soft base a sign of rot?', hours: 20 },
    ]
    for (const entry of queue) {
      const plant = ITEMS.find((item) => item.plant_species === entry.species)
      const update = {
        ...submitted,
        id: id(),
        journal_id: id(),
        created_at: iso(now() - entry.hours * 3600 * 1000),
        lighting: 'low',
        standing_water_over_1h: 'yes',
        dry_depth: 'not_dry',
        pot_weight_relative: 'about_same',
      }
      const created = now() - entry.hours * 3600 * 1000
      state.tickets.push({
        id: id(),
        status: 'open',
        created_at: iso(created),
        expires_at: iso(created + 72 * 3600 * 1000),
        answered_at: null,
        cancelled_at: null,
        answer_text: null,
        species: entry.species,
        photos: [
          { kind: 'overview', path: `/media/${plant?.slug ?? 'peace-lily'}.webp` },
          { kind: 'soil', path: '/media/lavender.webp' },
        ],
        context: ticketContext(update, entry.species, entry.question, diagnose(update)),
      })
    }
  }

  function ticketContext(update, species, userQuestion, diagnosis) {
    const { diagnosis: _d, escalation: _e, ...snapshot } = updateResponse(update)
    return {
      schema_version: 2,
      species,
      user_question: userQuestion,
      update: snapshot,
      diagnosis: {
        status: diagnosis.status,
        has_dominant_candidate: diagnosis.has_dominant_candidate,
        candidates: diagnosis.candidates,
        recommendation: diagnosis.recommendation,
      },
      clarifying_question: diagnosis.clarifying_question,
      clarifying_answer: diagnosis.clarifying_answer,
      history: [],
    }
  }

  seedDemoData()

  // --------------------------------------------------------------- http glue

  const originOf = (req) =>
    publicOrigin ??
    `${req.headers['x-forwarded-proto'] ?? 'http'}://${req.headers['x-forwarded-host'] ?? req.headers.host}`

  const json = (res, status, body, headers = {}) => {
    const payload = body === undefined ? '' : JSON.stringify(body)
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      ...headers,
    })
    res.end(payload)
  }

  const problem = (res, status, title, detail, code) =>
    json(
      res,
      status,
      {
        type: 'about:blank',
        title,
        status,
        detail,
        ...(code ? { code } : {}),
        correlation_id: id(),
      },
      { 'Content-Type': 'application/problem+json' },
    )

  const readBody = (req) =>
    new Promise((resolve, reject) => {
      const chunks = []
      req.on('data', (chunk) => chunks.push(chunk))
      req.on('end', () => resolve(Buffer.concat(chunks)))
      req.on('error', reject)
    })

  const readJsonBody = async (req) => {
    const raw = await readBody(req)
    if (raw.length === 0) return {}
    try {
      return JSON.parse(raw.toString('utf8'))
    } catch {
      return null
    }
  }

  function paginate(list, url) {
    const offset = Number(url.searchParams.get('cursor') ?? 0) || 0
    const limit = Math.min(Number(url.searchParams.get('limit') ?? PAGE_SIZE) || PAGE_SIZE, 100)
    const items = list.slice(offset, offset + limit)
    const next = offset + limit < list.length ? String(offset + limit) : null
    return { items, next_cursor: next }
  }

  const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')

  function tokenFor(user) {
    const groups = user.role === 'admin' ? ['admins'] : user.role === 'expert' ? ['experts'] : []
    const claims = {
      sub: user.user_id,
      email: user.email,
      'cognito:groups': groups,
      token_use: 'id',
      exp: Math.floor((now() + 8 * 3600 * 1000) / 1000),
    }
    return `${b64({ alg: 'none', typ: 'JWT' })}.${b64(claims)}.mock`
  }

  function userFromToken(token) {
    const payload = token?.split('.')[1]
    if (!payload) return null
    try {
      const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
      return users.get(claims.sub) ?? null
    } catch {
      return null
    }
  }

  async function cognito(req, res) {
    const body = await readJsonBody(req)
    const fail = (type, message) => json(res, 400, { __type: type, message })
    if (!body) return fail('InvalidParameterException', 'The request is not valid JSON.')

    if (body.AuthFlow === 'REFRESH_TOKEN_AUTH') {
      const user = users.get(
        String(body.AuthParameters?.REFRESH_TOKEN ?? '').replace('refresh.', ''),
      )
      if (!user || !user.enabled) return fail('NotAuthorizedException', 'Refresh Token is invalid.')
      return json(res, 200, { AuthenticationResult: { IdToken: tokenFor(user) } })
    }
    if (body.AuthFlow !== 'USER_PASSWORD_AUTH') {
      return fail('InvalidParameterException', 'Only USER_PASSWORD_AUTH is available in the mock.')
    }
    const email = String(body.AuthParameters?.USERNAME ?? '')
      .trim()
      .toLowerCase()
    const password = String(body.AuthParameters?.PASSWORD ?? '')
    const user = [...users.values()].find((u) => u.email.toLowerCase() === email)
    if (!user) return fail('UserNotFoundException', 'User does not exist.')
    if (!user.enabled) return fail('NotAuthorizedException', 'User is disabled.')
    if (password === '' || (user.password !== null && user.password !== password)) {
      return fail('NotAuthorizedException', 'Incorrect username or password.')
    }
    return json(res, 200, {
      AuthenticationResult: { IdToken: tokenFor(user), RefreshToken: `refresh.${user.user_id}` },
    })
  }

  const isPublic = (method, path) =>
    method === 'GET' &&
    (path === '/v1/items' || path.startsWith('/v1/items/') || path.startsWith('/v1/plants/'))

  const journalOf = (user, journalId) =>
    state.journals.find((j) => j.id === journalId && j.user_id === user.user_id)

  function updateOf(user, updateId) {
    const update = state.updates.find((u) => u.id === updateId)
    if (!update) return null
    return journalOf(user, update.journal_id) ? update : null
  }

  const confirmedOf = (updateId) => state.confirmed.get(updateId) ?? new Map()

  const photoList = (req, updateId) =>
    [...confirmedOf(updateId)].map(([kind, photo]) => ({
      kind,
      url: `${originOf(req)}${photo.path}`,
    }))

  async function route(req, res, url) {
    const { pathname: path } = url
    const method = req.method ?? 'GET'

    if (path === '/healthz') return json(res, 200, { status: 'ok' })
    if (path.replace(/\/+$/, '') === '/cognito' && method === 'POST') return cognito(req, res)

    const storage = /^\/mock-storage\/([^/]+)\/([^/]+)$/.exec(path)
    if (storage) {
      const key = `${storage[1]}/${storage[2]}`
      if (method === 'PUT') {
        const bytes = await readBody(req)
        state.uploads.set(key, {
          bytes,
          type: req.headers['content-type'] ?? 'application/octet-stream',
        })
        res.writeHead(200)
        return res.end()
      }
      const stored = state.uploads.get(key)
      if (!stored) return problem(res, 404, 'Not Found', 'No such photo.')
      res.writeHead(200, { 'Content-Type': stored.type, 'Cache-Control': 'no-cache' })
      return res.end(stored.bytes)
    }

    const media = /^\/media\/([A-Za-z0-9._-]+)$/.exec(path)
    if (media) {
      const file = normalize(join(here, '..', 'media', media[1]))
      if (!existsSync(file)) return problem(res, 404, 'Not Found', 'No such file.')
      const type = file.endsWith('.json') ? 'application/json' : 'image/webp'
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' })
      return createReadStream(file).pipe(res)
    }

    if (!path.startsWith('/v1/')) return problem(res, 404, 'Not Found', 'No such route.')

    const user = userFromToken(req.headers.authorization)
    if (!user && !isPublic(method, path)) return json(res, 401, { message: 'Unauthorized' })
    if (user && !user.enabled) return json(res, 403, { message: 'Forbidden' })

    // Public reads: the shop and the plant profiles.
    if (method === 'GET' && path === '/v1/items') return json(res, 200, paginate(ITEMS, url))
    let match = /^\/v1\/items\/([^/]+)$/.exec(path)
    if (match && method === 'GET') {
      const item = itemBySlug(decodeURIComponent(match[1]))
      return item ? json(res, 200, item) : problem(res, 404, 'Not Found', 'No such item.')
    }
    match = /^\/v1\/plants\/([^/]+)$/.exec(path)
    if (match && method === 'GET') {
      const plant = plantBySlug(decodeURIComponent(match[1]))
      return plant ? json(res, 200, plant) : problem(res, 404, 'Not Found', 'No such plant.')
    }

    if (path === '/v1/me' && method === 'GET') {
      const groups = user.role === 'admin' ? ['admins'] : user.role === 'expert' ? ['experts'] : []
      return json(res, 200, { user_id: user.user_id, role: user.role, groups })
    }
    if (path === '/v1/me/entitlement' && method === 'GET') return json(res, 200, entitlement(user))

    if (path === '/v1/orders' && method === 'POST') {
      const body = await readJsonBody(req)
      const item = ITEMS.find((candidate) => candidate.id === body?.item_id)
      if (!item) return problem(res, 404, 'Not Found', 'No such item.', 'item-not-found')
      return json(res, 201, (({ user_id: _u, ...order }) => order)(placeOrder(user, item)))
    }

    // ------------------------------------------------------------ journals
    if (path === '/v1/journals' && method === 'GET') {
      const own = state.journals
        .filter((journal) => journal.user_id === user.user_id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(journalResponse)
      return json(res, 200, paginate(own, url))
    }
    match = /^\/v1\/journals\/([^/]+)$/.exec(path)
    if (match && method === 'GET') {
      const journal = journalOf(user, match[1])
      return journal
        ? json(res, 200, journalResponse(journal))
        : problem(res, 404, 'Not Found', 'No such journal.')
    }
    match = /^\/v1\/journals\/([^/]+)\/planting$/.exec(path)
    if (match && method === 'PUT') {
      const journal = journalOf(user, match[1])
      if (!journal) return problem(res, 404, 'Not Found', 'No such journal.')
      const body = await readJsonBody(req)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body?.planted_on ?? '')) {
        return problem(
          res,
          422,
          'Validation failed',
          'planted_on must be a date.',
          'validation-error',
        )
      }
      if (journal.planted_on) {
        return problem(
          res,
          409,
          'Planting already recorded',
          'The planting date of this journal is already set and cannot be changed.',
          'planting-already-recorded',
        )
      }
      journal.planted_on = body.planted_on
      return json(res, 200, journalResponse(journal))
    }
    match = /^\/v1\/journals\/([^/]+)\/updates$/.exec(path)
    if (match && method === 'GET') {
      const journal = journalOf(user, match[1])
      if (!journal) return problem(res, 404, 'Not Found', 'No such journal.')
      const feed = state.updates
        .filter((update) => update.journal_id === journal.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(updateResponse)
      return json(res, 200, paginate(feed, url))
    }
    if (match && method === 'POST') {
      const journal = journalOf(user, match[1])
      if (!journal) return problem(res, 404, 'Not Found', 'No such journal.')
      const body = await readJsonBody(req)
      if (!body || !body.id || !body.lighting) {
        return problem(
          res,
          422,
          'Validation failed',
          'The lighting is required.',
          'validation-error',
        )
      }
      const existing = state.updates.find((update) => update.id === body.id)
      if (existing) return json(res, 200, updateResponse(existing))
      const update = {
        watering_method: 'unknown',
        pot_diameter_class: 'unknown',
        drainage_holes: 'unknown',
        standing_water_over_1h: 'unknown',
        dry_depth: 'unknown',
        pot_weight_relative: 'unknown',
        ...body,
        journal_id: journal.id,
        created_at: iso(now()),
      }
      state.updates.push(update)
      return json(res, 201, updateResponse(update))
    }
    match = /^\/v1\/journals\/([^/]+)\/chat\/turns$/.exec(path)
    if (match) {
      const journal = journalOf(user, match[1])
      if (!journal) return problem(res, 404, 'Not Found', 'No such journal.')
      if (method === 'GET') {
        const turns = state.chat
          .filter((turn) => turn.journal_id === journal.id)
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
        return json(res, 200, paginate(turns, url))
      }
      if (method === 'POST') {
        const body = await readJsonBody(req)
        const question = String(body?.question ?? '').trim()
        if (!question)
          return problem(res, 422, 'Validation failed', 'Ask a question.', 'validation-error')
        const found = state.chat.find((turn) => turn.id === body.id)
        if (found) return json(res, 200, found)
        useAi(user)
        const turn = {
          id: body.id ?? id(),
          journal_id: journal.id,
          question,
          model_effort: 'medium',
          created_at: iso(now()),
          related: [],
          ...answerQuestion(journal, question),
        }
        state.chat.push(turn)
        return json(res, 201, turn)
      }
    }

    // ------------------------------------------------------------- photos
    match = /^\/v1\/updates\/([^/]+)\/photos$/.exec(path)
    if (match) {
      const update = updateOf(user, match[1])
      if (!update) return problem(res, 404, 'Not Found', 'No such update.')
      if (method === 'POST') {
        const body = await readJsonBody(req)
        if (!PHOTO_KINDS.includes(body?.kind)) {
          return problem(res, 422, 'Validation failed', 'Unknown photo kind.', 'validation-error')
        }
        if (!/^image\/(jpeg|png|webp)$/.test(body.content_type ?? '')) {
          return problem(
            res,
            422,
            'Validation failed',
            'Use a JPEG, PNG or WebP photo.',
            'unsupported-media-type',
          )
        }
        if (!(body.size_bytes > 0 && body.size_bytes <= 10 * 1024 * 1024)) {
          return problem(
            res,
            422,
            'Validation failed',
            'The photo must be up to 10 MB.',
            'photo-too-large',
          )
        }
        return json(res, 200, {
          kind: body.kind,
          upload_url: `${originOf(req)}/mock-storage/${update.id}/${body.kind}`,
          expires_in_seconds: 900,
          required_headers: {
            'Content-Type': body.content_type,
            'Content-Length': String(body.size_bytes),
          },
        })
      }
      if (method === 'GET') {
        const done = confirmedOf(update.id)
        return json(res, 200, {
          photos: photoList(req, update.id),
          missing_required: REQUIRED_PHOTOS.filter((kind) => !done.has(kind)),
        })
      }
    }
    match = /^\/v1\/updates\/([^/]+)\/photos\/([^/]+)\/confirm$/.exec(path)
    if (match && method === 'POST') {
      const update = updateOf(user, match[1])
      if (!update) return problem(res, 404, 'Not Found', 'No such update.')
      const kind = match[2]
      if (!state.uploads.has(`${update.id}/${kind}`)) {
        return problem(
          res,
          409,
          'Photo not uploaded',
          'Upload the photo first.',
          'photo-not-uploaded',
        )
      }
      const photos = confirmedOf(update.id)
      photos.set(kind, { path: `/mock-storage/${update.id}/${kind}` })
      state.confirmed.set(update.id, photos)
      return json(res, 200, { kind, url: `${originOf(req)}/mock-storage/${update.id}/${kind}` })
    }

    // ---------------------------------------------------------- diagnosis
    match = /^\/v1\/updates\/([^/]+)\/diagnosis$/.exec(path)
    if (match) {
      const update = updateOf(user, match[1])
      if (!update) return problem(res, 404, 'Not Found', 'No such update.')
      if (method === 'GET') {
        const diagnosis = state.diagnoses.get(update.id)
        return diagnosis
          ? json(res, 200, diagnosis)
          : problem(
              res,
              404,
              'Not Found',
              'No diagnosis for this update yet.',
              'diagnosis-not-found',
            )
      }
      if (method === 'POST') {
        const existing = state.diagnoses.get(update.id)
        if (existing) return json(res, 200, existing)
        const done = confirmedOf(update.id)
        if (REQUIRED_PHOTOS.some((kind) => !done.has(kind))) {
          return problem(
            res,
            422,
            'Photos missing',
            'Add the whole-plant photo first.',
            'photos-missing',
          )
        }
        if (entitlement(user).ai_quota_today.used >= entitlement(user).ai_quota_today.limit) {
          return problem(
            res,
            429,
            'Quota used',
            'The AI quota of today is used.',
            'ai-quota-exceeded',
          )
        }
        useAi(user)
        const diagnosis = diagnose(update)
        state.diagnoses.set(update.id, diagnosis)
        return json(res, 200, diagnosis)
      }
    }
    match = /^\/v1\/updates\/([^/]+)\/diagnosis\/clarification$/.exec(path)
    if (match && method === 'POST') {
      const update = updateOf(user, match[1])
      const current = update && state.diagnoses.get(update.id)
      if (!current) return problem(res, 404, 'Not Found', 'No diagnosis to clarify.')
      if (current.status !== 'awaiting_clarification') {
        return problem(
          res,
          409,
          'Not waiting',
          'The diagnosis is not waiting for an answer.',
          'not-awaiting-clarification',
        )
      }
      const body = await readJsonBody(req)
      const answer = String(body?.answer ?? '').trim()
      if (!answer)
        return problem(res, 422, 'Validation failed', 'Write an answer.', 'validation-error')
      const next = diagnose({ ...update, dry_depth: 'about_2_3cm' }, answer)
      state.diagnoses.set(update.id, next)
      return json(res, 200, next)
    }
    match = /^\/v1\/updates\/([^/]+)\/diagnosis\/escalation-decline$/.exec(path)
    if (match && method === 'POST') {
      const update = updateOf(user, match[1])
      const current = update && state.diagnoses.get(update.id)
      if (!current) return problem(res, 404, 'Not Found', 'No diagnosis.')
      const next = { ...current, escalation_offered: false, escalation_declined: true }
      state.diagnoses.set(update.id, next)
      return json(res, 200, next)
    }

    // --------------------------------------------------------- escalation
    match = /^\/v1\/updates\/([^/]+)\/escalation$/.exec(path)
    if (match) {
      const update = updateOf(user, match[1])
      if (!update) return problem(res, 404, 'Not Found', 'No such update.')
      const existing = state.escalations.get(update.id)
      if (method === 'GET') {
        return existing
          ? json(res, 200, existing)
          : problem(res, 404, 'Not Found', 'No escalation for this update.', 'escalation-not-found')
      }
      if (method === 'POST') {
        if (existing) return json(res, 200, existing)
        const quota = entitlement(user).expert_quota_30_days
        if (quota.used >= quota.limit) {
          return problem(
            res,
            403,
            'Expert not available',
            'Your plan has no expert consultation left.',
            'expert-quota-exceeded',
          )
        }
        const body = await readJsonBody(req)
        const diagnosis = state.diagnoses.get(update.id)
        const journal = state.journals.find((j) => j.id === update.journal_id)
        const created = now()
        const escalation = {
          id: id(),
          status: 'ticket_open',
          answer_text: null,
          answered_at: null,
          created_at: iso(created),
          update_id: update.id,
          user_question: body?.user_question ?? null,
        }
        state.escalations.set(update.id, escalation)
        const key = `${user.user_id}:expert`
        state.usage.set(key, (state.usage.get(key) ?? 0) + 1)
        state.tickets.push({
          id: id(),
          update_id: update.id,
          status: 'open',
          created_at: iso(created),
          expires_at: iso(created + 72 * 3600 * 1000),
          answered_at: null,
          cancelled_at: null,
          answer_text: null,
          species: journal?.species ?? null,
          photos: [...confirmedOf(update.id)].map(([kind, photo]) => ({ kind, path: photo.path })),
          context: ticketContext(
            update,
            journal?.species ?? null,
            body?.user_question ?? null,
            diagnosis ?? diagnose(update),
          ),
        })
        return json(res, 201, escalation)
      }
    }

    // ------------------------------------------------------------- expert
    if (path.startsWith('/v1/expert/')) {
      if (user.role !== 'expert')
        return problem(res, 403, 'Forbidden', 'Only experts can do this.', 'forbidden')
      if (path === '/v1/expert/tickets' && method === 'GET') {
        const open = state.tickets
          .filter((ticket) => ticket.status === 'open')
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((ticket) => ({
            id: ticket.id,
            species: ticket.species,
            created_at: ticket.created_at,
            expires_at: ticket.expires_at,
          }))
        return json(res, 200, paginate(open, url))
      }
      match = /^\/v1\/expert\/tickets\/([^/]+)$/.exec(path)
      if (match && method === 'GET') {
        const ticket = state.tickets.find((t) => t.id === match[1])
        if (!ticket) return problem(res, 404, 'Not Found', 'No such ticket.')
        return json(res, 200, {
          id: ticket.id,
          status: ticket.status,
          created_at: ticket.created_at,
          expires_at: ticket.expires_at,
          answered_at: ticket.answered_at,
          cancelled_at: ticket.cancelled_at,
          context: ticket.context,
          photos: ticket.photos.map((photo) => ({
            kind: photo.kind,
            url: `${originOf(req)}${photo.path}`,
          })),
          answer_text: ticket.answer_text,
        })
      }
      match = /^\/v1\/expert\/tickets\/([^/]+)\/answer$/.exec(path)
      if (match && method === 'POST') {
        const ticket = state.tickets.find((t) => t.id === match[1])
        if (!ticket) return problem(res, 404, 'Not Found', 'No such ticket.')
        if (ticket.status !== 'open') {
          return problem(
            res,
            409,
            'Ticket closed',
            'This ticket is already answered.',
            'ticket-not-open',
          )
        }
        const body = await readJsonBody(req)
        const answer = String(body?.body ?? '').trim()
        if (!answer)
          return problem(res, 422, 'Validation failed', 'Write an answer.', 'validation-error')
        ticket.status = 'answered'
        ticket.answer_text = answer
        ticket.answered_at = iso(now())
        const escalation = ticket.update_id && state.escalations.get(ticket.update_id)
        if (escalation) {
          escalation.status = 'answered'
          escalation.answer_text = answer
          escalation.answered_at = ticket.answered_at
        }
        return json(res, 200, {
          ticket_id: ticket.id,
          status: ticket.status,
          answered_at: ticket.answered_at,
          answer_text: ticket.answer_text,
        })
      }
    }

    // -------------------------------------------------------------- admin
    if (path.startsWith('/v1/admin/')) {
      if (user.role !== 'admin')
        return problem(res, 403, 'Forbidden', 'Only administrators can do this.', 'forbidden')
      const view = ({ password: _p, tier: _t, ...rest }) => ({ ...rest, username: rest.email })
      if (path === '/v1/admin/users' && method === 'GET') {
        return json(res, 200, paginate([...users.values()].map(view), url))
      }
      if (path === '/v1/admin/users' && method === 'POST') {
        const body = await readJsonBody(req)
        const email = String(body?.email ?? '')
          .trim()
          .toLowerCase()
        if (
          !/^\S+@\S+\.\S+$/.test(email) ||
          !body?.password ||
          !['user', 'expert', 'admin'].includes(body.role)
        ) {
          return problem(
            res,
            422,
            'Validation failed',
            'Email, password and role are required.',
            'validation-error',
          )
        }
        if ([...users.values()].some((u) => u.email.toLowerCase() === email)) {
          return problem(
            res,
            409,
            'User exists',
            'A user with this email already exists.',
            'user-exists',
          )
        }
        const created = addUser(email, body.role, { password: body.password })
        return json(res, 201, view(created))
      }
      match = /^\/v1\/admin\/users\/([^/]+)\/(role|disable|enable|password)$/.exec(path)
      if (match) {
        const target = users.get(decodeURIComponent(match[1]))
        if (!target) return problem(res, 404, 'Not Found', 'No such user.')
        const body = await readJsonBody(req)
        if (match[2] === 'role' && method === 'PUT') {
          if (!['user', 'expert', 'admin'].includes(body?.role)) {
            return problem(res, 422, 'Validation failed', 'Unknown role.', 'validation-error')
          }
          target.role = body.role
          return json(res, 200, view(target))
        }
        if (method === 'POST' && match[2] === 'disable') {
          if (target.user_id === user.user_id) {
            return problem(
              res,
              409,
              'Not allowed',
              'You cannot disable yourself.',
              'cannot-disable-self',
            )
          }
          target.enabled = false
          res.writeHead(204)
          return res.end()
        }
        if (method === 'POST' && match[2] === 'enable') {
          target.enabled = true
          res.writeHead(204)
          return res.end()
        }
        if (method === 'POST' && match[2] === 'password') {
          if (!body?.password)
            return problem(res, 422, 'Validation failed', 'Enter a password.', 'validation-error')
          target.password = body.password
          res.writeHead(204)
          return res.end()
        }
      }
    }

    return problem(res, 404, 'Not Found', `The mock has no route for ${method} ${path}.`)
  }

  return createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://mock')
    route(req, res, url).catch((error) => {
      console.error(error)
      if (!res.headersSent) problem(res, 500, 'Mock error', String(error?.message ?? error))
      else res.end()
    })
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3100)
  const host = process.env.HOST ?? '0.0.0.0'
  createMockServer({ publicOrigin: process.env.PUBLIC_ORIGIN }).listen(port, host, () => {
    console.warn(`GrowPath mock backend on http://${host}:${port}`)
  })
}
