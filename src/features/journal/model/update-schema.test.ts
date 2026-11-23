import {
  emptyUpdateValues,
  lastWateredOn,
  toSubmitRequest,
  updateSchema,
  type UpdateFormValues,
} from './update-schema'

const answered = (overrides: Partial<UpdateFormValues> = {}): UpdateFormValues => ({
  ...emptyUpdateValues,
  lighting: 'medium',
  ...overrides,
})

const errorsOf = (values: unknown) => {
  const result = updateSchema.safeParse(values)
  return result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
}

describe('updateSchema', () => {
  it('needs only the lighting: "don\'t know" stands for everything else', () => {
    expect(errorsOf(answered())).toEqual([])
    expect(errorsOf({ ...emptyUpdateValues })).toEqual(['lighting: Choose the lighting'])
  })

  it('accepts a fully answered form', () => {
    expect(
      errorsOf(
        answered({
          last_watered_on: '2026-11-01',
          watering_method: 'through_drainage',
          pot_diameter_class: '20_30',
          drainage_holes: 'yes',
          standing_water_over_1h: 'no',
          dry_depth: 'about_5cm',
          pot_weight_relative: 'noticeably_lighter',
          pot_weight_after_watering_g: '2400',
          pot_weight_now_g: '1900',
          repotted_or_moved: 'no',
          sensor_reading: '35.5',
          sensor_unit: 'vwc_pct',
          air_temp_c: '22',
          air_rh_pct: '45',
          air_temp_min_c: '18',
          air_temp_max_c: '26',
          air_rh_min_pct: '35',
          air_rh_max_pct: '60',
        }),
      ),
    ).toEqual([])
  })

  it('rejects a watering date in the future', () => {
    expect(errorsOf(answered({ last_watered_on: '2999-01-01' }))).toEqual([
      'last_watered_on: The date cannot be in the future',
    ])
  })

  it('keeps numbers inside the ranges the backend accepts', () => {
    expect(errorsOf(answered({ pot_weight_now_g: '0' }))).toHaveLength(1)
    expect(errorsOf(answered({ pot_weight_now_g: '200001' }))).toHaveLength(1)
    expect(errorsOf(answered({ air_rh_pct: '101' }))).toHaveLength(1)
    expect(errorsOf(answered({ air_temp_c: '-51' }))).toHaveLength(1)
    expect(errorsOf(answered({ air_temp_c: 'warm' }))).toHaveLength(1)
    expect(errorsOf(answered({ sensor_reading: '-1', sensor_unit: 'raw' }))).toHaveLength(1)
  })

  it('wants the unit of a sensor reading', () => {
    expect(errorsOf(answered({ sensor_reading: '30' }))).toEqual([
      'sensor_unit: Choose the unit of the reading',
    ])
    expect(errorsOf(answered({ sensor_reading: '', sensor_unit: '' }))).toEqual([])
  })
})

describe('lastWateredOn', () => {
  it('uses the typed date when there is nothing to confirm', () => {
    expect(lastWateredOn(answered({ last_watered_on: '2026-11-05' }), null)).toBe('2026-11-05')
    expect(lastWateredOn(answered(), null)).toBeNull()
  })

  it('keeps the previous date when the user did not water since', () => {
    expect(lastWateredOn(answered({ watered_since: 'no' }), '2026-11-01')).toBe('2026-11-01')
  })

  it('takes the new date when the user watered since, and none without it', () => {
    expect(
      lastWateredOn(
        answered({ watered_since: 'yes', last_watered_on: '2026-11-07' }),
        '2026-11-01',
      ),
    ).toBe('2026-11-07')
    expect(lastWateredOn(answered({ watered_since: 'yes' }), '2026-11-01')).toBeNull()
  })

  it('gives no date for "don\'t know", so the interval is not calculated', () => {
    expect(lastWateredOn(answered({ watered_since: 'unknown' }), '2026-11-01')).toBeNull()
  })
})

describe('toSubmitRequest', () => {
  const now = new Date('2026-11-23T10:00:00Z')

  it('sends the answers as "unknown" and the rest as null when nothing else was given', () => {
    expect(toSubmitRequest(answered(), 'id-1', null, now)).toEqual({
      id: 'id-1',
      lighting: 'medium',
      last_watered_on: null,
      watering_method: 'unknown',
      pot_diameter_class: 'unknown',
      drainage_holes: 'unknown',
      standing_water_over_1h: 'unknown',
      dry_depth: 'unknown',
      pot_weight_relative: 'unknown',
      pot_weight_after_watering_g: null,
      pot_weight_now_g: null,
      repotted_or_moved: null,
      sensor_reading: null,
      sensor_unit: null,
      air_temp_c: null,
      air_rh_pct: null,
      air_measured_at: null,
      air_temp_min_c: null,
      air_temp_max_c: null,
      air_rh_min_pct: null,
      air_rh_max_pct: null,
    })
  })

  it('sends numbers, the unit of a reading and the time of an air measurement', () => {
    const request = toSubmitRequest(
      answered({
        pot_weight_now_g: '1900',
        sensor_reading: '35.5',
        sensor_unit: 'vwc_pct',
        air_temp_c: '22',
        repotted_or_moved: 'yes',
      }),
      'id-2',
      null,
      now,
    )
    expect(request).toMatchObject({
      pot_weight_now_g: 1900,
      sensor_reading: 35.5,
      sensor_unit: 'vwc_pct',
      air_temp_c: 22,
      air_measured_at: '2026-11-23T10:00:00.000Z',
      repotted_or_moved: 'yes',
    })
  })
})
