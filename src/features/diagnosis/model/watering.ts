import type { components } from '@/shared/api/schema/plant-care'

type Schemas = components['schemas']
export type Watering = Schemas['WateringResponse']
type Status = Schemas['Status']
type Flag = Schemas['Flag']
type Reliability = Schemas['Reliability']

export const statusSentence: Record<Status, string> = {
  underwatering: 'The plant looks underwatered: the soil is drier than it should be.',
  overwatering: 'The plant looks overwatered: the soil stays wetter than it should.',
  on_track: 'Watering looks on track.',
  unclear: 'There is not enough information to judge the watering yet.',
}

export const reliabilityLabel: Record<Reliability, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const flagSentence: Record<Flag, string> = {
  drainage_none:
    'The pot has no drainage holes, so water cannot run out and overwatering is likelier.',
  low_light_vs_species: 'The light is lower than this plant likes, so the soil dries slowly.',
  rh_below_species_range: 'The air is drier than this plant likes.',
  temp_outside_species_range: 'The temperature is outside the range this plant prefers.',
  top_dry_heavy_conflict:
    'The top of the soil is dry but the pot is heavy, so the soil deeper down is probably still wet. Check deeper before watering.',
}

const days = (count: number) => (count === 1 ? '1 day' : `${count} days`)

const round = (value: number) => Math.round(value * 10) / 10

/**
 * The corridor of the recommended interval in words: the range when both bounds are known, otherwise the single
 * recommended value, otherwise whatever text the backend gave. Null when there is nothing to say.
 */
export function intervalSentence(watering: Watering): string | null {
  const bounds = watering.I_rec_bounds
  if (bounds?.lower_days != null && bounds.upper_days != null) {
    return `Water every ${round(bounds.lower_days)} to ${round(bounds.upper_days)} days`
  }
  if (watering.I_rec_days != null) return `Water about every ${days(round(watering.I_rec_days))}`
  return bounds?.text ?? null
}

export function ownIntervalSentence(watering: Watering): string | null {
  return watering.I_fact_days != null
    ? `You water about every ${days(round(watering.I_fact_days))}`
    : null
}

/** The air readings used for the assessment, or null when none came with it. */
export function airSentence(watering: Watering): string | null {
  const { T, RH, VPD_kPa } = watering.air
  const parts = [
    T != null ? `${round(T)} °C` : null,
    RH != null ? `${round(RH)} % humidity` : null,
    VPD_kPa != null ? `${round(VPD_kPa)} kPa vapour pressure deficit` : null,
  ].filter((part): part is string => part !== null)
  return parts.length > 0 ? parts.join(', ') : null
}
