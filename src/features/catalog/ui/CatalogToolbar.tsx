import { useState } from 'react'
import { FilterMenu } from '@/shared/ui/FilterMenu'
import { CheckboxGroup, RadioGroup, type Option } from '@/shared/ui/OptionGroup'
import type { CatalogFilters, SortKey } from '../model/catalog-view'
import { defaultFilters, hasActiveFilters } from '../model/catalog-view'
import { labelDot } from '../model/label-dot'
import { groupLabels } from '../model/label-groups'
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

/** Past this many options a menu gets a box to find one by name. */
const SEARCH_FROM = 8

interface ChecklistProps {
  title: string
  name: string
  options: readonly Option<string>[]
  values: string[]
  onChange: (values: string[]) => void
}

function Checklist({ title, name, options, values, onChange }: ChecklistProps) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const shown = needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options

  return (
    <>
      {options.length > SEARCH_FROM && (
        <input
          type="search"
          className={styles.find}
          aria-label={`Find in ${title}`}
          placeholder={`Find ${title.toLowerCase()}…`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      )}
      <CheckboxGroup
        compact
        legend={title}
        name={name}
        values={values}
        options={shown}
        onChange={(next) => {
          const hidden = values.filter((value) => !shown.some((option) => option.value === value))
          onChange([...hidden, ...next])
        }}
      />
    </>
  )
}

export function CatalogToolbar({ filters, labels, onChange }: CatalogToolbarProps) {
  const labelGroups = groupLabels(labels)
  const sortLabel = sortOptions.find((option) => option.value === filters.sort)?.label

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
      <div className={styles.bar} role="group" aria-label="Filters">
        <span className={styles.barLabel} aria-hidden="true">
          Filters:
        </span>
        <FilterMenu
          label="Type"
          count={filters.types.length}
          onAll={() => onChange({ ...filters, types: typeOptions.map((o) => o.value) })}
          onNone={() => onChange({ ...filters, types: [] })}
        >
          <Checklist
            title="Type"
            name="catalog-type"
            options={typeOptions}
            values={filters.types}
            onChange={(types) => onChange({ ...filters, types })}
          />
        </FilterMenu>
        {labelGroups.map((group) => {
          const ticked = filters.labels.filter((label) => group.labels.includes(label))
          const others = filters.labels.filter((label) => !group.labels.includes(label))
          return (
            <FilterMenu
              key={group.id}
              label={group.title}
              count={ticked.length}
              onAll={() => onChange({ ...filters, labels: [...others, ...group.labels] })}
              onNone={() => onChange({ ...filters, labels: others })}
            >
              <Checklist
                title={group.title}
                name={`catalog-label-${group.id}`}
                options={group.labels.map((label) => ({
                  value: label,
                  label,
                  dot: labelDot(label),
                }))}
                values={ticked}
                onChange={(next) => onChange({ ...filters, labels: [...others, ...next] })}
              />
            </FilterMenu>
          )
        })}
        <FilterMenu label="Sort" value={sortLabel} active={filters.sort !== defaultFilters.sort}>
          <RadioGroup
            compact
            legend="Sort by"
            name="catalog-sort"
            value={filters.sort}
            options={sortOptions}
            onChange={(sort) => onChange({ ...filters, sort })}
          />
        </FilterMenu>
        {hasActiveFilters(filters) && (
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear filters"
            onClick={() => onChange(defaultFilters)}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
    </form>
  )
}
