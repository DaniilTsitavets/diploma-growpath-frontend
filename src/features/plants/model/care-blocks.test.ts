import {
  careBlocks,
  faqEntries,
  keyTakeaways,
  paragraphs,
  quickAnswer,
  quickFacts,
} from './care-blocks'
import type { Plant } from './types'

const base: Plant = {
  slug: 'x',
  species: 'X',
  sources: [
    { name: 'PlantSolve', url: 'https://www.plantsolve.com/plants/x/', license: 'CC BY 4.0' },
  ],
  updated_at: '2026-11-01',
}

describe('care blocks', () => {
  it('keeps every block in its place and leaves the missing ones empty', () => {
    const blocks = careBlocks({ ...base, watering: 'Every week.', soil: '  ', toxicity: 'Toxic.' })

    expect(blocks.map((block) => block.id)).toEqual([
      'light',
      'sunlight_hours',
      'watering',
      'placement',
      'soil',
      'humidity',
      'temperature',
      'pruning',
      'toxicity',
    ])
    expect(blocks.find((block) => block.id === 'watering')?.paragraphs).toEqual(['Every week.'])
    expect(blocks.find((block) => block.id === 'soil')?.paragraphs).toEqual([])
    expect(careBlocks(base).every((block) => block.paragraphs.length === 0)).toBe(true)
  })

  it('builds the strip of quick facts, with every slot present', () => {
    const plant: Plant = { ...base, light: 'Bright.', difficulty: 'Easy', humidity: 'Low' }

    expect(quickFacts(plant)).toEqual([
      { label: 'Difficulty', value: 'Easy' },
      { label: 'Light', value: 'Bright.' },
      { label: 'Temperature', value: null },
      { label: 'Humidity', value: 'Low' },
    ])
  })

  it('splits line breaks into paragraphs', () => {
    expect(paragraphs('Cats.\n\nDogs.\n')).toEqual(['Cats.', 'Dogs.'])
  })

  it('reads the quick answer and the takeaways, ignoring blanks', () => {
    expect(quickAnswer({ ...base, quick_answer: ' Water weekly. ' })).toBe('Water weekly.')
    expect(quickAnswer(base)).toBeNull()
    expect(keyTakeaways({ ...base, key_takeaways: ['One', ' ', 'Two'] })).toEqual(['One', 'Two'])
    expect(keyTakeaways(base)).toEqual([])
  })

  it('lists the questions and answers and drops incomplete ones', () => {
    expect(
      faqEntries({
        ...base,
        faq: [
          { question: ' How often? ', answer: ' Weekly. ' },
          { question: 'Why?', answer: ' ' },
          { question: '', answer: 'Because.' },
        ],
      }),
    ).toEqual([{ question: 'How often?', answer: 'Weekly.' }])
    expect(faqEntries(base)).toEqual([])
  })
})
