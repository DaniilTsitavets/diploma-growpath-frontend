import type { CatalogFilters, SortKey } from '../model/catalog-view'
import { ALL_LABELS } from '../model/catalog-view'
import { ChipToggle } from '@/shared/ui/Chip'
import styles from './CatalogToolbar.module.css'

interface CatalogToolbarProps {
  filters: CatalogFilters
  labels: string[]
  onChange: (filters: CatalogFilters) => void
}

export function CatalogToolbar({ filters, labels, onChange }: CatalogToolbarProps) {
  return (
    <form className={styles.toolbar} role="search" onSubmit={(event) => event.preventDefault()}>
      <div className={styles.field}>
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
      <div className={styles.field}>
        <label htmlFor="catalog-type">Type</label>
        <select
          id="catalog-type"
          className={styles.control}
          value={filters.type}
          onChange={(event) => onChange({ ...filters, type: event.target.value })}
        >
          <option value="all">All</option>
          <option value="pack">Grow packs</option>
          <option value="sensor">Sensors</option>
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="catalog-sort">Sort by</label>
        <select
          id="catalog-sort"
          className={styles.control}
          value={filters.sort}
          onChange={(event) => onChange({ ...filters, sort: event.target.value as SortKey })}
        >
          <option value="name">Name</option>
          <option value="price-asc">Price, low to high</option>
          <option value="price-desc">Price, high to low</option>
        </select>
      </div>
      <div className={styles.chips} role="group" aria-label="Filter by label">
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
