import { Button } from '@/shared/ui/Button'
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
  const discount = item.first_purchase_discount_pct
  return (
    <li className={styles.card}>
      <h2 className={styles.title}>{item.name}</h2>
      <p className={styles.meta}>{describe(item)}</p>
      {item.labels.length > 0 && (
        <ul className={styles.labels} aria-label="Labels">
          {item.labels.map((label) => (
            <li key={label} className={styles.label}>
              {label}
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
      <Button onClick={() => onOrder(item)} aria-label={`Order ${item.name}`}>
        Order
      </Button>
    </li>
  )
}
