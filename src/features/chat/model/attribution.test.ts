import { sourceCredits } from './attribution'
import type { ChatSource } from './types'

const source = (name: string, license: string, url: string): ChatSource => ({
  rank: 1,
  section_id: `${name}${url}`,
  document_title: `${name} guide`,
  section_heading: 'Watering',
  source_url: url,
  source_name: name,
  license,
})

describe('sourceCredits', () => {
  it('names each source and licence once, with the link of the first of its pages', () => {
    expect(
      sourceCredits([
        source('PlantSolve', 'CC BY 4.0', 'https://www.plantsolve.com/plants/lavender/'),
        source('PlantSolve', 'CC BY 4.0', 'https://www.plantsolve.com/dataset/'),
        source('Extension office', 'CC0', 'https://example.org/basil'),
      ]),
    ).toEqual([
      {
        name: 'PlantSolve',
        license: 'CC BY 4.0',
        href: 'https://www.plantsolve.com/plants/lavender/',
      },
      { name: 'Extension office', license: 'CC0', href: 'https://example.org/basil' },
    ])
  })

  it('keeps the credit but drops a link that is not a web address', () => {
    expect(sourceCredits([source('PlantSolve', 'CC BY 4.0', 'javascript:alert(1)')])).toEqual([
      { name: 'PlantSolve', license: 'CC BY 4.0', href: null },
    ])
  })

  it('gives nothing for an answer without sources', () => {
    expect(sourceCredits([])).toEqual([])
  })
})
