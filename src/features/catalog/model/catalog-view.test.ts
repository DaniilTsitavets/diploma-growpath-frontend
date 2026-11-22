import { applyFilters, collectLabels, defaultFilters } from './catalog-view'
import type { Item } from './types'

function item(overrides: Partial<Item>): Item {
  return {
    id: crypto.randomUUID(),
    item_type: 'pack',
    name: 'Pack',
    slug: 'pack',
    plant_slug: 'pack',
    plant_species: 'Basil',
    seed_count: 5,
    price_cents: 1000,
    first_purchase_discount_pct: null,
    labels: [],
    ...overrides,
  }
}

const basil = item({ name: "Beginner's Kit", price_cents: 2500, labels: ['beginner'] })
const mint = item({
  name: 'Mint Pack',
  plant_species: 'Mint',
  price_cents: 1800,
  labels: ['beginner', 'low-maintenance'],
})
const sensor = item({
  name: 'Soil Sensor',
  item_type: 'sensor',
  plant_species: null,
  seed_count: null,
  price_cents: 900,
})
const all = [basil, mint, sensor]

describe('applyFilters', () => {
  it('sorts by name by default', () => {
    expect(applyFilters(all, defaultFilters).map((i) => i.name)).toEqual([
      "Beginner's Kit",
      'Mint Pack',
      'Soil Sensor',
    ])
  })

  it('sorts by price in both directions', () => {
    const asc = applyFilters(all, { ...defaultFilters, sort: 'price-asc' })
    const desc = applyFilters(all, { ...defaultFilters, sort: 'price-desc' })
    expect(asc.map((i) => i.price_cents)).toEqual([900, 1800, 2500])
    expect(desc.map((i) => i.price_cents)).toEqual([2500, 1800, 900])
  })

  it('searches names, species and labels case-insensitively', () => {
    expect(applyFilters(all, { ...defaultFilters, search: 'MINT' })).toEqual([mint])
    expect(applyFilters(all, { ...defaultFilters, search: 'maintenance' })).toEqual([mint])
    expect(applyFilters(all, { ...defaultFilters, search: '  soil ' })).toEqual([sensor])
  })

  it('filters by item type and label', () => {
    expect(applyFilters(all, { ...defaultFilters, type: 'sensor' })).toEqual([sensor])
    expect(applyFilters(all, { ...defaultFilters, label: 'low-maintenance' })).toEqual([mint])
  })

  it('does not change the input array', () => {
    const input = [mint, basil]
    applyFilters(input, defaultFilters)
    expect(input).toEqual([mint, basil])
  })
})

describe('collectLabels', () => {
  it('returns unique sorted labels', () => {
    expect(collectLabels(all)).toEqual(['beginner', 'low-maintenance'])
  })
})
