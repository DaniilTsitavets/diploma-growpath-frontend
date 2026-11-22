import { dominanceNote } from './dominance'

describe('dominanceNote', () => {
  it('says whether one cause stands out', () => {
    expect(dominanceNote(true)).toBe('There is a clear main cause.')
    expect(dominanceNote(false)).toBe('The cause is ambiguous.')
  })

  it('says nothing when there is no result yet', () => {
    expect(dominanceNote(null)).toBeNull()
    expect(dominanceNote(undefined)).toBeNull()
  })
})
