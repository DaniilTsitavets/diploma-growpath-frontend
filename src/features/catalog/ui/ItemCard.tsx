import { useSession } from '@/features/auth/model/session-store'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Tag } from '@/shared/ui/Chip'
import { ItemImage } from './ItemImage'
import { discountedCents, formatPrice } from '../model/price'
import type { Item } from '../model/types'
import styles from './ItemCard.module.css'

interface ItemCardProps {
  item: Item
  onOrder: (item: Item) => void
}

function describe(item: Item): string {
  if (item.item_type === 'sensor') return 'Soil sensor'
  const seeds = item.seed_count === null ? '' : `, ${item.seed_count} seeds`
  return `${item.plant_species ?? 'Grow pack'}${seeds}`
}

export function ItemCard({ item, onOrder }: ItemCardProps) {
  const signedIn = Boolean(useSession((state) => state.session))
  const discount = item.first_purchase_discount_pct
  return (
    <Card as="li" className={styles.card}>
      <ItemImage itemType={item.item_type} />
      <div className={styles.body}>
        <h2 className={styles.title}>{item.name}</h2>
        <p className={styles.meta}>{describe(item)}</p>
        {item.labels.length > 0 && (
          <ul className={styles.labels} aria-label="Labels">
            {item.labels.map((label) => (
              <li key={label}>
                <Tag>{label}</Tag>
              </li>
            ))}
          </ul>
        )}
        <p className={styles.price}>{formatPrice(item.price_cents)}</p>
        {discount ? (
          <p className={styles.discount}>
            First purchase: {discount}% off,{' '}
            {formatPrice(discountedCents(item.price_cents, discount))}
          </p>
        ) : null}
        <Button
          variant={signedIn ? 'primary' : 'secondary'}
          onClick={() => onOrder(item)}
          aria-label={`${signedIn ? 'Order' : 'Sign in to order'} ${item.name}`}
        >
          {signedIn ? 'Order' : 'Sign in to order'}
        </Button>
      </div>
    </Card>
  )
}
