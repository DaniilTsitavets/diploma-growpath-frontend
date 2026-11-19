import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useSession } from '@/features/auth/model/session-store'
import { Card } from '@/shared/ui/Card'
import { ApiError } from '@/shared/api/api-error'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useItems } from '../api/use-items'
import {
  ALL_LABELS,
  ALL_TYPES,
  applyFilters,
  collectLabels,
  defaultFilters,
  type CatalogFilters,
  type SortKey,
} from '../model/catalog-view'
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
  const session = useSession((state) => state.session)
  const location = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data, isPending, error, refetch, isFetching } = useItems()
  const [type, setType] = useState(ALL_TYPES)
  const [sort, setSort] = useState<SortKey>('name')
  const [selected, setSelected] = useState<Item | null>(null)

  const search = params.get('q') ?? ''
  const label = params.get('label') ?? ALL_LABELS
  const filters = useMemo<CatalogFilters>(
    () => ({ search, label, type, sort }),
    [search, label, type, sort],
  )

  function changeFilters(next: CatalogFilters) {
    setType(next.type)
    setSort(next.sort)
    setParams(
      (current) => {
        const updated = new URLSearchParams(current)
        if (next.search) updated.set('q', next.search)
        else updated.delete('q')
        if (next.label !== ALL_LABELS) updated.set('label', next.label)
        else updated.delete('label')
        return updated
      },
      { replace: true },
    )
  }

  function orderOrSignIn(item: Item) {
    if (session) setSelected(item)
    else void navigate('/login', { state: { from: location.pathname + location.search } })
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
            <Button variant="secondary" onClick={() => changeFilters(defaultFilters)}>
              Clear filters
            </Button>
          ) : (
            <ul className={styles.grid}>
              {visible.map((item) => (
                <ItemCard key={item.id} item={item} onOrder={orderOrSignIn} />
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
