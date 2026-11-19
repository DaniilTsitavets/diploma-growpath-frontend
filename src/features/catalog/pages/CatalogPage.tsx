import { useMemo, useState } from 'react'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useItems } from '../api/use-items'
import { applyFilters, collectLabels, defaultFilters } from '../model/catalog-view'
import type { Item } from '../model/types'
import { CatalogToolbar } from '../ui/CatalogToolbar'
import { ItemCard } from '../ui/ItemCard'
import { OrderDialog } from '../ui/OrderDialog'
import styles from './CatalogPage.module.css'

const SKELETON_COUNT = 6

function CatalogSkeleton() {
  return (
    <ul className={styles.grid} aria-hidden="true">
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <li key={index} className={styles.skeletonCard}>
          <Skeleton height="1.25rem" width="60%" />
          <Skeleton width="40%" />
          <Skeleton height="1.5rem" width="30%" />
          <Skeleton height="2.75rem" />
        </li>
      ))}
    </ul>
  )
}

export function CatalogPage() {
  const { data, isPending, error, refetch, isFetching } = useItems()
  const [filters, setFilters] = useState(defaultFilters)
  const [selected, setSelected] = useState<Item | null>(null)

  const labels = useMemo(() => collectLabels(data ?? []), [data])
  const visible = useMemo(() => applyFilters(data ?? [], filters), [data, filters])

  return (
    <>
      <h1>Catalog</h1>
      {isPending && (
        <div aria-busy="true">
          <p className="visually-hidden" role="status">
            Loading the catalog
          </p>
          <CatalogSkeleton />
        </div>
      )}
      {error && (
        <div role="alert">
          <p className={styles.error}>{describeError(error)}</p>
          <Button onClick={() => void refetch()} disabled={isFetching}>
            Try again
          </Button>
        </div>
      )}
      {data && (
        <>
          <CatalogToolbar filters={filters} labels={labels} onChange={setFilters} />
          <p className={styles.status} role="status">
            {visible.length === 1 ? '1 item' : `${visible.length} items`}
          </p>
          {visible.length === 0 ? (
            <Button variant="secondary" onClick={() => setFilters(defaultFilters)}>
              Clear filters
            </Button>
          ) : (
            <ul className={styles.grid}>
              {visible.map((item) => (
                <ItemCard key={item.id} item={item} onOrder={setSelected} />
              ))}
            </ul>
          )}
        </>
      )}
      {selected && (
        <OrderDialog key={selected.id} item={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
