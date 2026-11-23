import type { Plant } from './types'

export interface Fact {
  label: string
  /** Null when the backend has no data for this plant; the strip still shows the slot, so every plant page looks alike. */
  value: string | null
}

export interface CareBlock {
  id: string
  title: string
  /** Empty when the backend has no data for this plant; the block keeps its place so every plant page looks alike. */
  paragraphs: string[]
}

const FACTS: readonly [keyof Plant, string][] = [
  ['difficulty', 'Difficulty'],
  ['light', 'Light'],
  ['temperature', 'Temperature'],
  ['humidity', 'Humidity'],
]

const BLOCKS: readonly [keyof Plant, string][] = [
  ['light', 'Light'],
  ['sunlight_hours', 'Sunlight hours'],
  ['watering', 'Watering'],
  ['placement', 'Placement'],
  ['soil', 'Soil'],
  ['humidity', 'Humidity'],
  ['temperature', 'Temperature'],
  ['pruning', 'Pruning'],
  ['toxicity', 'Toxicity'],
]

/** A field the backend did not send is simply missing; an empty string is treated the same way. */
function text(plant: Plant, key: keyof Plant): string | null {
  const value = plant[key]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

/** Text can carry line breaks (toxicity does), which become separate paragraphs. */
export function paragraphs(value: string): string[] {
  return value
    .split(/\n+/)
    .map((part) => part.trim())
    .filter((part) => part !== '')
}

export function quickFacts(plant: Plant): Fact[] {
  return FACTS.map(([key, label]) => ({ label, value: text(plant, key) }))
}

export function careBlocks(plant: Plant): CareBlock[] {
  return BLOCKS.map(([key, title]) => {
    const value = text(plant, key)
    return { id: key, title, paragraphs: value === null ? [] : paragraphs(value) }
  })
}

export function keyTakeaways(plant: Plant): string[] {
  return (plant.key_takeaways ?? []).map((item) => item.trim()).filter((item) => item !== '')
}

export const quickAnswer = (plant: Plant) => text(plant, 'quick_answer')
