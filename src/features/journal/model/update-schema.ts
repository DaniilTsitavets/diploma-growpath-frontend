import { z } from 'zod'
import { todayIso } from './dates'
import type { SubmitUpdateRequest } from './types'

const choice = <const T extends [string, ...string[]]>(values: T, message = 'Choose an option') =>
  z.enum(values, { error: message })

const isEmpty = (value: string) => value.trim() === ''

/** An optional number typed into a field, kept as text until the request is built. */
const optionalNumber = (label: string, min: number, max: number, minExclusive = false) =>
  z.string().refine(
    (value) => {
      if (isEmpty(value)) return true
      const number = Number(value)
      return (
        Number.isFinite(number) && (minExclusive ? number > min : number >= min) && number <= max
      )
    },
    {
      message: `${label} must be ${minExclusive ? 'above' : 'from'} ${min} ${minExclusive ? 'and up to' : 'to'} ${max}`,
    },
  )

const answer = choice(['yes', 'no', 'unknown'])

export const updateSchema = z
  .object({
    /** Only asked when the previous update gave a watering date. */
    watered_since: choice(['no', 'yes', 'unknown']),
    last_watered_on: z.string().refine((value) => isEmpty(value) || value <= todayIso(), {
      message: 'The date cannot be in the future',
    }),
    watering_method: choice(['through_drainage', 'partial', 'unknown']),
    pot_diameter_class: choice(['lt_10', '10_15', '15_20', '20_30', 'gt_30', 'unknown']),
    drainage_holes: answer,
    standing_water_over_1h: answer,
    dry_depth: choice(['not_dry', 'about_2_3cm', 'about_5cm', 'whole_root_ball_dry', 'unknown']),
    pot_weight_relative: choice(['about_same', 'noticeably_lighter', 'very_light', 'unknown']),
    pot_weight_after_watering_g: optionalNumber('The weight', 0, 200000, true),
    pot_weight_now_g: optionalNumber('The weight', 0, 200000, true),
    lighting: choice(['low', 'medium', 'bright_indirect', 'direct_sun'], 'Choose the lighting'),
    repotted_or_moved: choice(['yes', 'no', 'unknown']),
    sensor_reading: optionalNumber('The reading', 0, Number.MAX_SAFE_INTEGER),
    sensor_unit: z.string(),
    air_temp_c: optionalNumber('The temperature', -50, 60),
    air_rh_pct: optionalNumber('The humidity', 0, 100),
    air_temp_min_c: optionalNumber('The temperature', -50, 60),
    air_temp_max_c: optionalNumber('The temperature', -50, 60),
    air_rh_min_pct: optionalNumber('The humidity', 0, 100),
    air_rh_max_pct: optionalNumber('The humidity', 0, 100),
  })
  .superRefine((values, context) => {
    if (!isEmpty(values.sensor_reading) && values.sensor_unit === '') {
      context.addIssue({
        code: 'custom',
        path: ['sensor_unit'],
        message: 'Choose the unit of the reading',
      })
    }
  })

export type UpdateFormValues = z.infer<typeof updateSchema>

export const emptyUpdateValues: Omit<UpdateFormValues, 'lighting'> & { lighting: '' } = {
  watered_since: 'unknown',
  last_watered_on: '',
  watering_method: 'unknown',
  pot_diameter_class: 'unknown',
  drainage_holes: 'unknown',
  standing_water_over_1h: 'unknown',
  dry_depth: 'unknown',
  pot_weight_relative: 'unknown',
  pot_weight_after_watering_g: '',
  pot_weight_now_g: '',
  lighting: '',
  repotted_or_moved: 'unknown',
  sensor_reading: '',
  sensor_unit: '',
  air_temp_c: '',
  air_rh_pct: '',
  air_temp_min_c: '',
  air_temp_max_c: '',
  air_rh_min_pct: '',
  air_rh_max_pct: '',
}

const number = (value: string) => (isEmpty(value) ? null : Number(value))

/**
 * The date of the last watering. With a date from the previous update, the answer to "did you water since?"
 * decides: no keeps that date, yes takes the new one, and "don't know" gives none, so the interval is not calculated.
 */
export function lastWateredOn(values: UpdateFormValues, previous: string | null): string | null {
  if (previous === null) return isEmpty(values.last_watered_on) ? null : values.last_watered_on
  if (values.watered_since === 'no') return previous
  if (values.watered_since === 'yes') {
    return isEmpty(values.last_watered_on) ? null : values.last_watered_on
  }
  return null
}

export function toSubmitRequest(
  values: UpdateFormValues,
  id: string,
  previousWateredOn: string | null,
  now = new Date(),
): SubmitUpdateRequest {
  const hasAirNow = !isEmpty(values.air_temp_c) || !isEmpty(values.air_rh_pct)
  return {
    id,
    lighting: values.lighting,
    last_watered_on: lastWateredOn(values, previousWateredOn),
    watering_method: values.watering_method,
    pot_diameter_class: values.pot_diameter_class,
    drainage_holes: values.drainage_holes,
    standing_water_over_1h: values.standing_water_over_1h,
    dry_depth: values.dry_depth,
    pot_weight_relative: values.pot_weight_relative,
    pot_weight_after_watering_g: number(values.pot_weight_after_watering_g),
    pot_weight_now_g: number(values.pot_weight_now_g),
    repotted_or_moved: values.repotted_or_moved === 'unknown' ? null : values.repotted_or_moved,
    sensor_reading: number(values.sensor_reading),
    sensor_unit: isEmpty(values.sensor_reading) ? null : (values.sensor_unit as 'vwc_pct' | 'raw'),
    air_temp_c: number(values.air_temp_c),
    air_rh_pct: number(values.air_rh_pct),
    air_measured_at: hasAirNow ? now.toISOString() : null,
    air_temp_min_c: number(values.air_temp_min_c),
    air_temp_max_c: number(values.air_temp_max_c),
    air_rh_min_pct: number(values.air_rh_min_pct),
    air_rh_max_pct: number(values.air_rh_max_pct),
  }
}
