import type { Item } from './types'

export type SortKey = 'name' | 'price-asc' | 'price-desc'

export interface CatalogFilters {
  search: string
  /** An item matches when its type is any of these; empty means no type filtering. */
  types: string[]
  /** An item must carry every one of these labels; empty means no label filtering. */
  labels: string[]
  sort: SortKey
}

export const defaultFilters: CatalogFilters = {
  search: '',
  types: [],
  labels: [],
  sort: 'name',
}

export function collectLabels(items: Item[]): string[] {
  return [...new Set(items.flatMap((item) => item.labels))].sort((a, b) => a.localeCompare(b))
}

/** The filters set in the panel; the search box has its own field and is not counted. */
export function countActiveFilters(filters: CatalogFilters): number {
  const sortChanged = filters.sort === defaultFilters.sort ? 0 : 1
  return filters.types.length + filters.labels.length + sortChanged
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return countActiveFilters(filters) > 0 || filters.search !== ''
}

function matchesSearch(item: Item, query: string): boolean {
  const haystack = [item.name, item.plant_species ?? '', ...item.labels].join(' ').toLowerCase()
  return haystack.includes(query)
}

const comparators: Record<SortKey, (a: Item, b: Item) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  'price-asc': (a, b) => a.price_cents - b.price_cents || a.name.localeCompare(b.name),
  'price-desc': (a, b) => b.price_cents - a.price_cents || a.name.localeCompare(b.name),
}

export function applyFilters(items: Item[], filters: CatalogFilters): Item[] {
  const query = filters.search.trim().toLowerCase()
  return items
    .filter((item) => filters.types.length === 0 || filters.types.includes(item.item_type))
    .filter((item) => filters.labels.every((label) => item.labels.includes(label)))
    .filter((item) => query === '' || matchesSearch(item, query))
    .sort(comparators[filters.sort])
}
