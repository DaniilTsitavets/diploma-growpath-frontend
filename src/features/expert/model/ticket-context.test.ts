import { humanize, parseTicketContext } from './ticket-context'

const full = {
  schema_version: 1,
  species: 'Basil',
  update: {
    id: 'u1',
    created_at: '2026-11-19T10:00:00+00:00',
    last_watered_on: '2026-11-17',
    watering_interval_days: 3,
    drainage: 'poor',
    lighting: 'low',
    finger_test: 'wet',
    pot_weight: 'heavier',
    sensor_reading: null,
  },
  photos: [{ kind: 'overview', storage_key: 'k' }],
  user_question: 'Is this root rot?',
  diagnosis: {
    status: 'completed',
    has_dominant_candidate: true,
    candidates: [{ rank: 1, cause: 'Overwatering', rationale: 'Wet soil.' }],
    recommendation: 'Let it dry.',
  },
  clarifying_question: 'How often do you water?',
  clarifying_answer: 'Daily',
  history: [{ date: '2026-11-10', diagnosis_status: 'completed', top_cause: 'Low light' }],
}

describe('parseTicketContext', () => {
  it('reads every block of a version 1 snapshot', () => {
    const context = parseTicketContext(full)

    expect(context.supported).toBe(true)
    expect(context.species).toBe('Basil')
    expect(context.update).toMatchObject({ drainage: 'poor', watering_interval_days: 3 })
    expect(context.update?.sensor_reading).toBeNull()
    expect(context.userQuestion).toBe('Is this root rot?')
    expect(context.diagnosis?.candidates).toHaveLength(1)
    expect(context.clarification).toEqual({ question: 'How often do you water?', answer: 'Daily' })
    expect(context.history).toEqual([
      { date: '2026-11-10', diagnosis_status: 'completed', top_cause: 'Low light' },
    ])
  })

  it('reads a version 2 snapshot and keeps the new answers of its update', () => {
    const context = parseTicketContext({
      schema_version: 2,
      species: 'Basil',
      update: { id: 'u2', lighting: 'low', pot_diameter_class: '20_30', dry_depth: 'about_5cm' },
      photos: [],
      history: [],
    })

    expect(context.supported).toBe(true)
    expect(context.update).toMatchObject({ pot_diameter_class: '20_30', dry_depth: 'about_5cm' })
  })

  it('treats optional blocks as simply absent', () => {
    const context = parseTicketContext({ schema_version: 1, species: 'Mint', update: { id: 'u' } })

    expect(context.userQuestion).toBeUndefined()
    expect(context.diagnosis).toBeUndefined()
    expect(context.clarification).toBeUndefined()
    expect(context.history).toEqual([])
  })

  it('flags a newer version but still shows what it recognises', () => {
    const context = parseTicketContext({ ...full, schema_version: 3 })

    expect(context.supported).toBe(false)
    expect(context.species).toBe('Basil')
  })

  it('skips a block of the wrong shape instead of failing', () => {
    const context = parseTicketContext({ ...full, update: 'nope', diagnosis: 7, history: 'x' })

    expect(context.update).toBeUndefined()
    expect(context.diagnosis).toBeUndefined()
    expect(context.history).toEqual([])
    expect(context.species).toBe('Basil')
  })

  it('survives a context that is not an object', () => {
    expect(parseTicketContext(null)).toMatchObject({ supported: false, history: [] })
  })
})

describe('humanize', () => {
  const labels = { poor: 'Poor, water drains slowly' }

  it('translates a known value and keeps an unknown one as it is', () => {
    expect(humanize(labels, 'poor')).toBe('Poor, water drains slowly')
    expect(humanize(labels, 'brand_new')).toBe('brand_new')
    expect(humanize(labels, undefined)).toBe('Not given')
  })
})
