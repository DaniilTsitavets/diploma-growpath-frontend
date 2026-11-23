import { defaultFilters } from './catalog-view'
import { filtersFromParams, writeFiltersToParams } from './filter-params'

describe('filter params', () => {
  it('reads repeated type and label parameters and a valid sort', () => {
    const filters = filtersFromParams(
      new URLSearchParams('q=mint&type=pack&type=sensor&label=a&label=b&sort=price-desc'),
    )
    expect(filters).toEqual({
      search: 'mint',
      types: ['pack', 'sensor'],
      labels: ['a', 'b'],
      sort: 'price-desc',
    })
  })

  it('falls back to the default sort for an unknown value', () => {
    expect(filtersFromParams(new URLSearchParams('sort=nope')).sort).toBe('name')
  })

  it('keeps a single ?label= link working', () => {
    expect(filtersFromParams(new URLSearchParams('label=beginner')).labels).toEqual(['beginner'])
  })

  it('writes the filters, omits defaults and keeps foreign parameters', () => {
    const params = new URLSearchParams('keep=1&type=old')
    writeFiltersToParams(params, { ...defaultFilters, types: ['pack'], labels: ['a', 'b'] })
    expect(params.toString()).toBe('keep=1&type=pack&label=a&label=b')

    writeFiltersToParams(params, defaultFilters)
    expect(params.toString()).toBe('keep=1')
  })
})
