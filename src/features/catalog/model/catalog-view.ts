import type { Item } from './types'

export const ALL_TYPES = 'all'
export type SortKey = 'name' | 'price-asc' | 'price-desc'

export interface CatalogFilters {
  search: string
  type: string
  label: string
  sort: SortKey
}

export const ALL_LABELS = 'all'

export const defaultFilters: CatalogFilters = {
  search: '',
  type: ALL_TYPES,
  label: ALL_LABELS,
  sort: 'name',
}

export function collectLabels(items: Item[]): string[] {
  return [...new Set(items.flatMap((item) => item.labels))].sort((a, b) => a.localeCompare(b))
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
    .filter((item) => filters.type === ALL_TYPES || item.item_type === filters.type)
    .filter((item) => filters.label === ALL_LABELS || item.labels.includes(filters.label))
    .filter((item) => query === '' || matchesSearch(item, query))
    .sort(comparators[filters.sort])
}
