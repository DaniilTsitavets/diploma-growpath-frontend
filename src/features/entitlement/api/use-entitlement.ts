import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import type { Entitlement } from '../model/types'

export const entitlementKey = ['entitlement'] as const

/** The gateway route maps the token's user to the entitlement; the OpenAPI path takes a user id instead. */
export function useEntitlement() {
  return useQuery({
    queryKey: entitlementKey,
    queryFn: ({ signal }) => api.request<Entitlement>('GET', '/v1/me/entitlement', { signal }),
  })
}
