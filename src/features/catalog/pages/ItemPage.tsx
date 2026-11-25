import { useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router'
import { useSession } from '@/features/auth/model/session-store'
import { useMediaCredits } from '@/features/media/api/use-media-credits'
import { photoCaption } from '@/features/media/model/caption'
import { usePlant } from '@/features/plants/api/use-plant'
import { PlantCare } from '@/features/plants/ui/PlantCare'
import { ApiError } from '@/shared/api/api-error'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { Tag } from '@/shared/ui/Chip'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useItem } from '../api/use-items'
import type { Item } from '../model/types'
import { discountedCents, formatPrice } from '../model/price'
import { ItemImage } from '../ui/ItemImage'
import { useOrderFlow } from '../ui/use-order-flow'
import styles from './ItemPage.module.css'

function PhotoCaption({ slug }: { slug: string }) {
  const credit = useMediaCredits().data?.find((entry) => entry.slug === slug)
  if (!credit) return null
  const caption = photoCaption(credit)
  return (
    <p className={styles.caption}>
      {caption.href ? (
        <a href={caption.href} rel="noreferrer">
          {caption.text}
        </a>
      ) : (
        caption.text
      )}
    </p>
  )
}

export function ItemPage() {
  const { slug = '' } = useParams()
  const location = useLocation()
  const session = useSession((state) => state.session)
  const item = useItem(slug)
  // Sensors have no plant profile, so the request is sent only once the item, or the shop list already
  // loaded, says which plant it has. The care section reads the same cache entry.
  const listed = useQueryClient()
    .getQueryData<Item[]>(['items'])
    ?.find((i) => i.slug === slug)
  usePlant(item.data?.plant_slug ?? listed?.plant_slug ?? null)
  const order = useOrderFlow()

  if (item.isPending) {
    return (
      <div aria-busy="true">
        <p className="visually-hidden" role="status">
          Loading the item
        </p>
        <Skeleton height="title" width={40} />
        <Skeleton height="block" />
      </div>
    )
  }

  if (item.error) {
    const error = item.error
    if (!session && error instanceof ApiError && error.kind === 'unauthorized') {
      return (
        <>
          <h1>Shop</h1>
          <p>Sign in to see this item and its price.</p>
          <Link to="/login" state={{ from: location.pathname }}>
            Sign in
          </Link>
        </>
      )
    }
    const missing = error instanceof ApiError && error.kind === 'not-found'
    return (
      <div role="alert">
        <h1>{missing ? 'Item not found' : 'Could not load the item'}</h1>
        <p className={styles.error}>
          {missing ? 'This item is not in the shop.' : describeError(error)}
        </p>
        {!missing && <Button onClick={() => void item.refetch()}>Try again</Button>}
        <p>
          <Link to="/shop">Back to the shop</Link>
        </p>
      </div>
    )
  }

  const data = item.data
  const discount = data.first_purchase_discount_pct
  const signedIn = Boolean(session)

  return (
    <>
      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <Link to="/shop">Shop</Link> / <span aria-current="page">{data.name}</span>
      </nav>
      <div className={styles.hero}>
        <div className={styles.picture}>
          <ItemImage itemType={data.item_type} slug={data.slug} priority="high" />
          <PhotoCaption slug={data.slug} />
        </div>
        <div className={styles.info}>
          <p className="eyebrow">{data.item_type === 'sensor' ? 'Sensor' : 'Starter pack'}</p>
          <h1>{data.name}</h1>
          {data.plant_species && <p className={styles.latin}>{data.plant_species}</p>}
          {data.seed_count !== null && <p>{data.seed_count} seeds in the pack</p>}
          {data.labels.length > 0 && (
            <ul className={styles.labels} aria-label="Labels">
              {data.labels.map((label) => (
                <li key={label}>
                  <Tag>{label}</Tag>
                </li>
              ))}
            </ul>
          )}
          <p className={styles.price}>{formatPrice(data.price_cents)}</p>
          {discount ? (
            <p className={styles.discount}>
              First purchase: {discount}% off,{' '}
              {formatPrice(discountedCents(data.price_cents, discount))}
            </p>
          ) : null}
          <Button variant={signedIn ? 'primary' : 'secondary'} onClick={() => order.start(data)}>
            {signedIn ? 'Order' : 'Sign in to order'}
          </Button>
        </div>
      </div>
      {data.plant_slug && <PlantCare plantSlug={data.plant_slug} />}
      {order.dialog}
    </>
  )
}
