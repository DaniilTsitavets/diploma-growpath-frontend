import { ChipToggle } from '@/shared/ui/Chip'
import { ChoiceChips } from '@/shared/ui/ChoiceChips'
import type { CatalogFilters, SortKey } from '../model/catalog-view'
import { ALL_LABELS, ALL_TYPES } from '../model/catalog-view'
import { labelDot } from '../model/label-dot'
import styles from './CatalogToolbar.module.css'

interface CatalogToolbarProps {
  filters: CatalogFilters
  labels: string[]
  onChange: (filters: CatalogFilters) => void
}

const sortOptions: readonly { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
]

const typeOptions = [
  { value: ALL_TYPES, label: 'All' },
  { value: 'pack', label: 'Grow packs' },
  { value: 'sensor', label: 'Sensors' },
]

export function CatalogToolbar({ filters, labels, onChange }: CatalogToolbarProps) {
  return (
    <form className={styles.toolbar} role="search" onSubmit={(event) => event.preventDefault()}>
      <div className={styles.search}>
        <label htmlFor="catalog-search">Search</label>
        <input
          id="catalog-search"
          type="search"
          enterKeyHint="search"
          className={styles.control}
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
      </div>
      <ChoiceChips
        legend="Type"
        name="catalog-type"
        value={filters.type}
        options={typeOptions}
        onChange={(type) => onChange({ ...filters, type })}
      />
      <ChoiceChips
        legend="Sort by"
        name="catalog-sort"
        value={filters.sort}
        options={sortOptions}
        onChange={(sort) => onChange({ ...filters, sort })}
      />
      <div className={styles.needs} role="group" aria-label="Filter by label">
        <p className="eyebrow">Browse by need</p>
        <div className={styles.chipRow}>
          <ChipToggle
            pressed={filters.label === ALL_LABELS}
            onClick={() => onChange({ ...filters, label: ALL_LABELS })}
          >
            All
          </ChipToggle>
          {labels.map((label) => (
            <ChipToggle
              key={label}
              dot={labelDot(label)}
              pressed={filters.label === label}
              onClick={() => onChange({ ...filters, label })}
            >
              {label}
            </ChipToggle>
          ))}
        </div>
      </div>
    </form>
  )
}
