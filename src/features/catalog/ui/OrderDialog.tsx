import { useEffect, useRef, useState } from 'react'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { useCreateOrder } from '../api/use-create-order'
import { discountedCents, formatPrice } from '../model/price'
import type { Item } from '../model/types'
import styles from './OrderDialog.module.css'

interface OrderDialogProps {
  item: Item
  onClose: () => void
}

/** Mounted per selected item, so the idempotency key lives exactly as long as one purchase attempt. */
export function OrderDialog({ item, onClose }: OrderDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const order = useCreateOrder(idempotencyKey)
  const discount = item.first_purchase_discount_pct

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const placed = order.data

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="order-title"
      onClose={onClose}
    >
      <h2 id="order-title" className={styles.title}>
        {placed ? 'Order placed' : `Order ${item.name}`}
      </h2>
      {placed ? (
        <dl className={styles.summary}>
          <dt>Price</dt>
          <dd>{formatPrice(placed.list_price_cents)}</dd>
          <dt>Discount</dt>
          <dd>−{formatPrice(placed.discount_cents)}</dd>
          <dt>Paid</dt>
          <dd>{formatPrice(placed.total_paid_cents)}</dd>
        </dl>
      ) : (
        <>
          <dl className={styles.summary}>
            <dt>Price</dt>
            <dd>{formatPrice(item.price_cents)}</dd>
            {discount ? (
              <>
                <dt>First purchase ({discount}% off)</dt>
                <dd>{formatPrice(discountedCents(item.price_cents, discount))}</dd>
              </>
            ) : null}
          </dl>
          <p className={styles.note}>Payment is simulated: no money is charged.</p>
          {order.error && (
            <p role="alert" className={styles.error}>
              {describeError(order.error)}
            </p>
          )}
        </>
      )}
      <form method="dialog" className={styles.actions}>
        {placed ? (
          <Button type="submit" autoFocus>
            Close
          </Button>
        ) : (
          <>
            <Button type="submit" variant="secondary" autoFocus>
              Cancel
            </Button>
            <Button disabled={order.isPending} onClick={() => order.mutate(item.id)}>
              {order.isPending ? 'Placing order…' : 'Confirm order'}
            </Button>
          </>
        )}
      </form>
    </dialog>
  )
}
