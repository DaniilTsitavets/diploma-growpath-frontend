import { priorityForIndex } from './image-priority'

describe('priorityForIndex', () => {
  it('prioritises the first card and the rest of the first row, then waits', () => {
    expect([0, 1, 3, 4, 9].map(priorityForIndex)).toEqual([
      'high',
      'normal',
      'normal',
      'lazy',
      'lazy',
    ])
  })
})
