import { api } from '@/shared/api/client'
import { listAllPages } from '@/shared/api/pagination'
import type { Item, Order } from '../model/types'

export function listItems(signal?: AbortSignal) {
  return listAllPages<Item>('/v1/items', signal)
}

export function createOrder(itemId: string, idempotencyKey: string) {
  return api.request<Order>('POST', '/v1/orders', {
    body: { item_id: itemId },
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}
