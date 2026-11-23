import { useMemo } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { useSession } from '@/features/auth/model/session-store'
import { Card } from '@/shared/ui/Card'
import { ApiError } from '@/shared/api/api-error'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useItems } from '../api/use-items'
import { applyFilters, collectLabels, type CatalogFilters } from '../model/catalog-view'
import { filtersFromParams, writeFiltersToParams } from '../model/filter-params'
import { priorityForIndex } from '../model/image-priority'
import { CatalogToolbar } from '../ui/CatalogToolbar'
import { ItemCard } from '../ui/ItemCard'
import { useOrderFlow } from '../ui/use-order-flow'
import styles from './CatalogPage.module.css'

const SKELETON_COUNT = 6

function CatalogSkeleton() {
  return (
    <ul className={styles.grid} aria-hidden="true">
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <li key={index} className={styles.skeletonCard}>
          <Skeleton height="heading" width={60} />
          <Skeleton width={40} />
          <Skeleton height="price" width={30} />
          <Skeleton height="button" />
        </li>
      ))}
    </ul>
  )
}

export function CatalogPage() {
  const session = useSession((state) => state.session)
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const { data, isPending, error, refetch, isFetching } = useItems()
  const order = useOrderFlow()

  const filters = useMemo(() => filtersFromParams(params), [params])

  function changeFilters(next: CatalogFilters) {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current)
        writeFiltersToParams(updated, next)
        return updated
      },
      { replace: true },
    )
  }

  const labels = useMemo(() => collectLabels(data ?? []), [data])
  const visible = useMemo(() => applyFilters(data ?? [], filters), [data, filters])

  if (!session && error instanceof ApiError && error.kind === 'unauthorized') {
    return (
      <>
        <h1>Shop</h1>
        <Card className={styles.gate}>
          <p>Sign in to see the packs and their prices.</p>
          <Link to="/login" state={{ from: location.pathname + location.search }}>
            Sign in
          </Link>
        </Card>
      </>
    )
  }

  return (
    <>
      <p className="eyebrow">Starter packs and sensors</p>
      <h1>Shop</h1>
      {isPending && (
        <div aria-busy="true">
          <p className="visually-hidden" role="status">
            Loading the shop
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
          <CatalogToolbar filters={filters} labels={labels} onChange={changeFilters} />
          <p className={styles.status} role="status">
            {visible.length === 1 ? '1 item' : `${visible.length} items`}
          </p>
          {visible.length === 0 ? (
            <p>No items match these filters.</p>
          ) : (
            <ul className={styles.grid}>
              {visible.map((item, index) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onOrder={order.start}
                  imagePriority={priorityForIndex(index)}
                />
              ))}
            </ul>
          )}
        </>
      )}
      {order.dialog}
    </>
  )
}
