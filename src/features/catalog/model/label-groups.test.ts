import { groupLabels, matchesLabels } from './label-groups'

const titles = (labels: string[]) =>
  groupLabels(labels).map((group) => [group.title, group.labels] as const)

describe('groupLabels', () => {
  it('splits the labels by topic and keeps each group in its own order', () => {
    expect(
      titles([
        'advanced',
        'air-purifying',
        'beginner',
        'bright-light',
        'compact',
        'drought-tolerant',
        'edible',
        'flowering',
        'hanging',
        'herb',
        'low-light',
        'pet-safe',
        'rare',
        'toxic-to-pets',
        'weird-new-label',
      ]),
    ).toEqual([
      ['Light', ['low-light', 'bright-light']],
      ['Difficulty', ['beginner', 'advanced']],
      ['Pets', ['pet-safe', 'toxic-to-pets']],
      ['Size and habit', ['compact', 'hanging']],
      ['Plant type', ['herb', 'edible']],
      ['Features', ['flowering', 'air-purifying', 'rare']],
      ['Other', ['drought-tolerant', 'weird-new-label']],
    ])
  })

  it('moves a topic with a single label to Other', () => {
    expect(titles(['beginner', 'low-light', 'direct-sun', 'edible'])).toEqual([
      ['Light', ['low-light', 'direct-sun']],
      ['Other', ['beginner', 'edible']],
    ])
  })

  it('has no group without labels', () => {
    expect(groupLabels([])).toEqual([])
    expect(titles(['rare'])).toEqual([['Other', ['rare']]])
  })
})

describe('matchesLabels', () => {
  it('lets any ticked light level through', () => {
    expect(matchesLabels(['low-light'], ['low-light', 'bright-light'])).toBe(true)
    expect(matchesLabels(['direct-sun'], ['low-light', 'bright-light'])).toBe(false)
  })

  it('lets any ticked difficulty, pet and size option through', () => {
    expect(matchesLabels(['advanced'], ['beginner', 'advanced'])).toBe(true)
    expect(matchesLabels(['pet-safe'], ['pet-safe', 'toxic-to-pets'])).toBe(true)
    expect(matchesLabels(['large'], ['compact', 'hanging'])).toBe(false)
  })

  it('requires every ticked label of the other topics', () => {
    expect(matchesLabels(['edible', 'herb'], ['edible', 'herb'])).toBe(true)
    expect(matchesLabels(['edible'], ['edible', 'herb'])).toBe(false)
    expect(matchesLabels(['likes-moisture'], ['likes-moisture', 'humidity-lover'])).toBe(false)
  })

  it('requires an unknown label as well', () => {
    expect(matchesLabels(['strange'], ['strange'])).toBe(true)
    expect(matchesLabels([], ['strange'])).toBe(false)
  })

  it('combines the groups with and', () => {
    const ticked = ['low-light', 'beginner', 'pet-safe']
    expect(matchesLabels(['low-light', 'beginner', 'pet-safe'], ticked)).toBe(true)
    expect(matchesLabels(['low-light', 'advanced', 'pet-safe'], ticked)).toBe(false)
  })

  it('does not filter when nothing is ticked', () => {
    expect(matchesLabels([], [])).toBe(true)
  })
})
