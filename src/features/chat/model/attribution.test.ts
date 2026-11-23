import { plantSolveSource } from './attribution'
import type { ChatSource } from './types'

const source = (url: string): ChatSource => ({
  rank: 1,
  section_id: url,
  document_title: 'Lavender (PlantSolve)',
  source_name: 'PlantSolve',
  license: 'CC BY 4.0',
  section_heading: 'Watering',
  source_url: url,
})

describe('plantSolveSource', () => {
  it('returns the link of the first PlantSolve source', () => {
    expect(
      plantSolveSource([
        source('https://example.org/x'),
        source('https://www.plantsolve.com/plants/lavender/'),
        source('https://www.plantsolve.com/dataset/'),
      ]),
    ).toEqual({ href: 'https://www.plantsolve.com/plants/lavender/' })
  })

  it('ignores other hosts, look-alikes and links that are not web addresses', () => {
    expect(
      plantSolveSource([
        source('https://plantsolve.com.evil.test/'),
        source('javascript:alert(1)'),
        source('not a url'),
      ]),
    ).toBeNull()
    expect(plantSolveSource([])).toBeNull()
  })
})
