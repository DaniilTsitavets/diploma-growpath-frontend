import { answerRows } from './answers'

const labelled = (rows: { label: string; value: string }[]) =>
  Object.fromEntries(rows.map((row) => [row.label, row.value]))

describe('answerRows', () => {
  it('shows what was answered, in the order of the form, and leaves out "don\'t know"', () => {
    const rows = answerRows({
      lighting: 'low',
      last_watered_on: '2026-11-01',
      watering_method: 'partial',
      pot_diameter_class: 'unknown',
      drainage_holes: 'yes',
      standing_water_over_1h: 'unknown',
      dry_depth: 'about_5cm',
      pot_weight_relative: 'noticeably_lighter',
      repotted_or_moved: 'no',
    })

    expect(rows.map((row) => row.label)).toEqual([
      'Lighting',
      'Last watered',
      'Watering',
      'Drainage holes',
      'Soil dry down to',
      'Pot weight',
      'Repotted or moved',
    ])
    expect(labelled(rows)['Last watered']).toBe('Nov 1, 2026')
    expect(labelled(rows)['Soil dry down to']).toBe('Dry about 5 cm down')
  })

  it('shows weights, the sensor with its unit, and the air readings', () => {
    const rows = labelled(
      answerRows({
        lighting: 'medium',
        pot_weight_after_watering_g: '2400',
        pot_weight_now_g: 1900,
        sensor_reading: '35.5',
        sensor_unit: 'vwc_pct',
        air_temp_c: '22',
        air_rh_pct: '45',
        air_temp_min_c: '18',
        air_temp_max_c: '26',
      }),
    )

    expect(rows.Weighed).toBe('2400 g after watering, 1900 g now')
    expect(rows['Soil sensor']).toBe('35.5 % soil moisture')
    expect(rows['Air temperature']).toBe('22 °C')
    expect(rows['Air humidity']).toBe('45 %')
    expect(rows['Temperature range']).toBe('18 to 26 °C')
  })

  it('still reads the answers of the retired questionnaire in an old ticket', () => {
    const rows = labelled(
      answerRows({
        lighting: 'low',
        drainage: 'poor',
        finger_test: 'wet',
        pot_weight: 'heavier',
        watering_interval_days: 3,
      }),
    )

    expect(rows.Drainage).toBe('Poor, water drains slowly')
    expect(rows['Soil by finger test']).toBe('Wet')
    expect(rows['Pot weight']).toBe('Heavier than usual')
    expect(rows['Watering interval']).toBe('3 days')
  })

  it('shows nothing for an update with no answers', () => {
    expect(answerRows({ id: 'u' })).toEqual([])
  })
})
