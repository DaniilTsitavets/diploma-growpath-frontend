import { z } from 'zod'
import { todayIso } from './dates'
import type { SubmitUpdateRequest } from './types'

const choice = <const T extends [string, ...string[]]>(values: T) =>
  z.enum(values, { error: 'Choose an option' })

const isEmpty = (value: string) => value.trim() === ''

export const updateSchema = z.object({
  last_watered_on: z.string().refine((value) => isEmpty(value) || value <= todayIso(), {
    message: 'The date cannot be in the future',
  }),
  watering_interval_days: z.string().refine(
    (value) => {
      if (isEmpty(value)) return true
      const days = Number(value)
      return Number.isInteger(days) && days >= 1 && days <= 365
    },
    { message: 'Enter a whole number of days from 1 to 365' },
  ),
  drainage: choice(['good', 'poor', 'none']),
  lighting: choice(['low', 'medium', 'bright_indirect', 'direct_sun']),
  finger_test: choice(['dry', 'slightly_moist', 'wet']),
  pot_weight: choice(['lighter', 'as_expected', 'heavier']),
  sensor_reading: z.string().refine((value) => isEmpty(value) || Number(value) >= 0, {
    message: 'Enter a number, zero or more',
  }),
})

export type UpdateFormValues = z.infer<typeof updateSchema>

export const emptyUpdateValues = {
  last_watered_on: '',
  watering_interval_days: '',
  drainage: '',
  lighting: '',
  finger_test: '',
  pot_weight: '',
  sensor_reading: '',
}

export function toSubmitRequest(values: UpdateFormValues, id: string): SubmitUpdateRequest {
  return {
    id,
    last_watered_on: isEmpty(values.last_watered_on) ? null : values.last_watered_on,
    watering_interval_days: isEmpty(values.watering_interval_days)
      ? null
      : Number(values.watering_interval_days),
    drainage: values.drainage,
    lighting: values.lighting,
    finger_test: values.finger_test,
    pot_weight: values.pot_weight,
    sensor_reading: isEmpty(values.sensor_reading) ? null : Number(values.sensor_reading),
  }
}
