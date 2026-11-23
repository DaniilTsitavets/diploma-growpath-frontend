import type {
  Answer,
  DryDepth,
  Lighting,
  PotDiameterClass,
  PotWeightRelative,
  SensorUnit,
  WateringMethod,
} from './types'

const UNKNOWN = "Don't know"

export const lightingLabels: Record<Lighting, string> = {
  low: 'Low light',
  medium: 'Medium light',
  bright_indirect: 'Bright, indirect',
  direct_sun: 'Direct sun',
}

export const lightingHint =
  'Low: far from a window or a north-facing room. Medium: a few metres from a window. Bright, indirect: close to a window with no direct sun on the leaves. Direct sun: sun on the leaves for hours.'

export const wateringMethodLabels: Record<WateringMethod, string> = {
  through_drainage: 'Until water ran out at the bottom',
  partial: 'A little at a time',
  unknown: UNKNOWN,
}

export const potDiameterLabels: Record<PotDiameterClass, string> = {
  lt_10: 'Under 10 cm',
  '10_15': '10 to 15 cm',
  '15_20': '15 to 20 cm',
  '20_30': '20 to 30 cm',
  gt_30: 'Over 30 cm',
  unknown: UNKNOWN,
}

export const answerLabels: Record<Answer, string> = { yes: 'Yes', no: 'No', unknown: UNKNOWN }

export const dryDepthLabels: Record<DryDepth, string> = {
  not_dry: 'Not dry at all',
  about_2_3cm: 'Dry about 2 to 3 cm down',
  about_5cm: 'Dry about 5 cm down',
  whole_root_ball_dry: 'The whole root ball is dry and pulls from the pot walls',
  unknown: UNKNOWN,
}

export const potWeightLabels: Record<PotWeightRelative, string> = {
  about_same: 'About the same as right after watering',
  noticeably_lighter: 'Noticeably lighter',
  very_light: 'Very light',
  unknown: UNKNOWN,
}

/** "Not sure" is not sent: an unanswered question is simply left out of the request. */
export const repottedLabels = { yes: 'Yes', no: 'No', unknown: 'Not sure' } as const

export const sensorUnitLabels: Record<SensorUnit, string> = {
  vwc_pct: '% soil moisture',
  raw: 'Raw value',
}

/** Pots from 20 cm up: their weight is the main sign of how dry the soil is. */
export const isLargePot = (diameter: string) => diameter === '20_30' || diameter === 'gt_30'
