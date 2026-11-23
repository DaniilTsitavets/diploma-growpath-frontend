import { defaultFilters, type CatalogFilters, type SortKey } from './catalog-view'

const sortKeys: readonly SortKey[] = ['name', 'price-asc', 'price-desc']

function isSortKey(value: string | null): value is SortKey {
  return sortKeys.some((key) => key === value)
}

export function filtersFromParams(params: URLSearchParams): CatalogFilters {
  const sort = params.get('sort')
  return {
    search: params.get('q') ?? '',
    types: params.getAll('type'),
    labels: params.getAll('label'),
    sort: isSortKey(sort) ? sort : defaultFilters.sort,
  }
}

/** Rewrites only the filter keys, so unrelated parameters survive. */
export function writeFiltersToParams(params: URLSearchParams, filters: CatalogFilters): void {
  params.delete('q')
  params.delete('type')
  params.delete('label')
  params.delete('sort')
  if (filters.search) params.set('q', filters.search)
  filters.types.forEach((type) => params.append('type', type))
  filters.labels.forEach((label) => params.append('label', label))
  if (filters.sort !== defaultFilters.sort) params.set('sort', filters.sort)
}
