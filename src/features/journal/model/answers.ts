import { formatDate } from './dates'
import {
  answerLabels,
  dryDepthLabels,
  lightingLabels,
  potDiameterLabels,
  potWeightLabels,
  repottedLabels,
  sensorUnitLabels,
  wateringMethodLabels,
} from './labels'

export interface AnswerRow {
  label: string
  value: string
}

/** The retired questionnaire: tickets that were opened before the switch still carry these answers (for 72 hours). */
const legacy = {
  drainage: {
    label: 'Drainage',
    values: {
      good: 'Good, water runs out',
      poor: 'Poor, water drains slowly',
      none: 'None, no drainage holes',
    },
  },
  finger_test: {
    label: 'Soil by finger test',
    values: { dry: 'Dry', slightly_moist: 'Slightly moist', wet: 'Wet' },
  },
  pot_weight: {
    label: 'Pot weight',
    values: {
      lighter: 'Lighter than usual',
      as_expected: 'As expected',
      heavier: 'Heavier than usual',
    },
  },
} as const

type Source = Record<string, unknown>

const present = (value: unknown): value is string | number =>
  (typeof value === 'string' && value.trim() !== '' && value !== 'unknown') ||
  typeof value === 'number'

function pick(
  source: Source,
  key: string,
  labels: Record<string, string>,
  label: string,
): AnswerRow[] {
  const value = source[key]
  return present(value) ? [{ label, value: labels[String(value)] ?? String(value) }] : []
}

function range(
  source: Source,
  low: string,
  high: string,
  unit: string,
  label: string,
): AnswerRow[] {
  const from = source[low]
  const to = source[high]
  if (present(from) && present(to)) return [{ label, value: `${from} to ${to} ${unit}` }]
  if (present(from)) return [{ label, value: `from ${from} ${unit}` }]
  if (present(to)) return [{ label, value: `up to ${to} ${unit}` }]
  return []
}

/**
 * The answers of an update as rows to show. A question answered "don't know" or left out is not shown, and the
 * rows follow the order of the form. Works for an update of the app and for the snapshot an expert sees, in
 * either version of the questionnaire.
 */
export function answerRows(update: Source): AnswerRow[] {
  const watered = update.last_watered_on
  const weights = [update.pot_weight_after_watering_g, update.pot_weight_now_g]
  const reading = update.sensor_reading

  const rows: AnswerRow[] = [
    ...pick(update, 'lighting', lightingLabels, 'Lighting'),
    ...(typeof watered === 'string' && watered !== ''
      ? [{ label: 'Last watered', value: formatDate(watered) }]
      : []),
    ...pick(update, 'watering_method', wateringMethodLabels, 'Watering'),
    ...pick(update, 'pot_diameter_class', potDiameterLabels, 'Pot diameter'),
    ...pick(update, 'drainage_holes', answerLabels, 'Drainage holes'),
    ...pick(update, 'standing_water_over_1h', answerLabels, 'Water standing for over an hour'),
    ...pick(update, 'dry_depth', dryDepthLabels, 'Soil dry down to'),
    ...pick(update, 'pot_weight_relative', potWeightLabels, 'Pot weight'),
    ...(weights.every(present)
      ? [{ label: 'Weighed', value: `${weights[0]} g after watering, ${weights[1]} g now` }]
      : weights.some(present)
        ? [{ label: 'Weighed', value: `${String(weights.find(present))} g` }]
        : []),
    ...pick(update, 'repotted_or_moved', repottedLabels, 'Repotted or moved'),
    ...(present(reading)
      ? [
          {
            label: 'Soil sensor',
            value:
              `${reading} ${sensorUnitLabels[update.sensor_unit as 'vwc_pct' | 'raw']?.toLowerCase() ?? ''}`.trim(),
          },
        ]
      : []),
    ...(present(update.air_temp_c)
      ? [{ label: 'Air temperature', value: `${update.air_temp_c} °C` }]
      : []),
    ...(present(update.air_rh_pct)
      ? [{ label: 'Air humidity', value: `${update.air_rh_pct} %` }]
      : []),
    ...range(update, 'air_temp_min_c', 'air_temp_max_c', '°C', 'Temperature range'),
    ...range(update, 'air_rh_min_pct', 'air_rh_max_pct', '%', 'Humidity range'),
  ]

  for (const [key, { label, values }] of Object.entries(legacy)) {
    rows.push(...pick(update, key, values, label))
  }
  if (present(update.watering_interval_days)) {
    rows.push({ label: 'Watering interval', value: `${update.watering_interval_days} days` })
  }
  return rows
}
