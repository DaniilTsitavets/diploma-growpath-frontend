import { useMutation } from '@tanstack/react-query'
import { createOrder } from './catalog-api'

export function useCreateOrder(idempotencyKey: string) {
  return useMutation({
    mutationFn: (itemId: string) => createOrder(itemId, idempotencyKey),
    meta: { handledInline: true },
  })
}
