import { api } from '@/shared/api/client'
import type { Item, Order } from '../model/types'

export function listItems(signal?: AbortSignal) {
  return api.request<Item[]>('GET', '/v1/items', { signal })
}

export function getItem(slug: string, signal?: AbortSignal) {
  return api.request<Item>('GET', `/v1/items/${encodeURIComponent(slug)}`, { signal })
}

export function createOrder(itemId: string, idempotencyKey: string) {
  return api.request<Order>('POST', '/v1/orders', {
    body: { item_id: itemId },
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}
