import { Button } from '@/shared/ui/Button'
import { CheckboxGroup, RadioGroup } from '@/shared/ui/OptionGroup'
import type { CatalogFilters, SortKey } from '../model/catalog-view'
import { countActiveFilters, defaultFilters, hasActiveFilters } from '../model/catalog-view'
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
  { value: 'pack', label: 'Grow packs' },
  { value: 'sensor', label: 'Sensors' },
]

export function CatalogToolbar({ filters, labels, onChange }: CatalogToolbarProps) {
  const active = countActiveFilters(filters)
  const labelOptions = labels.map((label) => ({ value: label, label, dot: labelDot(label) }))

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
      <details className={styles.panel} open>
        <summary className={styles.summary}>
          {active > 0 ? `Filters (${active})` : 'Filters'}
        </summary>
        <div className={styles.groups}>
          <CheckboxGroup
            legend="Filter by type"
            name="catalog-type"
            values={filters.types}
            options={typeOptions}
            onChange={(types) => onChange({ ...filters, types })}
          />
          {labelOptions.length > 0 && (
            <CheckboxGroup
              legend="Filter by need"
              hint="Shows items that match every ticked need."
              name="catalog-label"
              values={filters.labels}
              options={labelOptions}
              onChange={(next) => onChange({ ...filters, labels: next })}
            />
          )}
          <RadioGroup
            legend="Sort by"
            name="catalog-sort"
            value={filters.sort}
            options={sortOptions}
            onChange={(sort) => onChange({ ...filters, sort })}
          />
          {hasActiveFilters(filters) && (
            <div>
              <Button variant="secondary" onClick={() => onChange(defaultFilters)}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </details>
    </form>
  )
}
