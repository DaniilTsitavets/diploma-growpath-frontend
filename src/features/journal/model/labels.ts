import type { Drainage, FingerTest, Lighting, PotWeight } from './types'

export const drainageLabels: Record<Drainage, string> = {
  good: 'Good, water runs out',
  poor: 'Poor, water drains slowly',
  none: 'None, no drainage holes',
}

export const lightingLabels: Record<Lighting, string> = {
  low: 'Low light',
  medium: 'Medium light',
  bright_indirect: 'Bright, indirect',
  direct_sun: 'Direct sun',
}

export const fingerTestLabels: Record<FingerTest, string> = {
  dry: 'Dry',
  slightly_moist: 'Slightly moist',
  wet: 'Wet',
}

export const potWeightLabels: Record<PotWeight, string> = {
  lighter: 'Lighter than usual',
  as_expected: 'As expected',
  heavier: 'Heavier than usual',
}
