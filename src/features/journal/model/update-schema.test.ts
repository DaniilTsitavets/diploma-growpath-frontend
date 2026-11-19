import { emptyUpdateValues, toSubmitRequest, updateSchema } from './update-schema'

const valid = {
  ...emptyUpdateValues,
  drainage: 'good',
  lighting: 'medium',
  finger_test: 'dry',
  pot_weight: 'as_expected',
}

describe('updateSchema', () => {
  it('accepts the required choices and leaves the rest empty', () => {
    expect(updateSchema.safeParse(valid).success).toBe(true)
  })

  it('requires the four questionnaire choices', () => {
    const result = updateSchema.safeParse(emptyUpdateValues)
    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual([
      'drainage',
      'lighting',
      'finger_test',
      'pot_weight',
    ])
  })

  it('rejects an out-of-range interval and a future watering date', () => {
    expect(updateSchema.safeParse({ ...valid, watering_interval_days: '400' }).success).toBe(false)
    expect(updateSchema.safeParse({ ...valid, watering_interval_days: '2.5' }).success).toBe(false)
    expect(updateSchema.safeParse({ ...valid, last_watered_on: '2999-01-01' }).success).toBe(false)
  })

  it('rejects a negative sensor reading', () => {
    expect(updateSchema.safeParse({ ...valid, sensor_reading: '-1' }).success).toBe(false)
  })
})

describe('toSubmitRequest', () => {
  it('maps empty optional fields to null and numbers to numbers', () => {
    const parsed = updateSchema.parse({
      ...valid,
      watering_interval_days: '3',
      sensor_reading: '82.5',
    })
    expect(toSubmitRequest(parsed, 'id-1')).toEqual({
      id: 'id-1',
      last_watered_on: null,
      watering_interval_days: 3,
      drainage: 'good',
      lighting: 'medium',
      finger_test: 'dry',
      pot_weight: 'as_expected',
      sensor_reading: 82.5,
    })
  })
})
