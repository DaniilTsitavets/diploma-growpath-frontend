import {
  airSentence,
  flagSentence,
  intervalSentence,
  ownIntervalSentence,
  statusSentence,
  type Watering,
} from './watering'

const watering = (overrides: Partial<Watering> = {}): Watering => ({
  status: 'on_track',
  reliability: 'medium',
  depletion_D: null,
  D_source: 'none',
  target_p: 0.5,
  p_source: 'default',
  I_rec_days: null,
  I_rec_bounds: null,
  I_fact_days: null,
  ratio_r: null,
  Ks: null,
  flags: [],
  air: { T: null, RH: null, VPD_kPa: null },
  calibration: { n_observations: 0, reset_reason: null },
  assumptions: [],
  ...overrides,
})

describe('intervalSentence', () => {
  it('gives the corridor when both bounds are known', () => {
    expect(
      intervalSentence(
        watering({ I_rec_days: 8, I_rec_bounds: { lower_days: 7, upper_days: 10.04, text: null } }),
      ),
    ).toBe('Water every 7 to 10 days')
  })

  it('falls back to the single recommended value, then to the text of the backend', () => {
    expect(intervalSentence(watering({ I_rec_days: 1 }))).toBe('Water about every 1 day')
    expect(intervalSentence(watering({ I_rec_days: 6.5 }))).toBe('Water about every 6.5 days')
    expect(
      intervalSentence(
        watering({
          I_rec_bounds: { lower_days: null, upper_days: null, text: 'Wait until the soil dries' },
        }),
      ),
    ).toBe('Wait until the soil dries')
    expect(intervalSentence(watering())).toBeNull()
  })
})

describe('the other sentences', () => {
  it('shows how often the user waters, only when it is known', () => {
    expect(ownIntervalSentence(watering({ I_fact_days: 3 }))).toBe('You water about every 3 days')
    expect(ownIntervalSentence(watering())).toBeNull()
  })

  it('lists the air readings that came, and nothing when none did', () => {
    expect(airSentence(watering({ air: { T: 22.04, RH: 45, VPD_kPa: null } }))).toBe(
      '22 °C, 45 % humidity',
    )
    expect(airSentence(watering())).toBeNull()
  })

  it('has a sentence for every status and every flag', () => {
    expect(Object.keys(statusSentence).sort()).toEqual([
      'on_track',
      'overwatering',
      'unclear',
      'underwatering',
    ])
    expect(Object.keys(flagSentence)).toHaveLength(5)
  })
})
