import { api } from '@/shared/api/client'
import type { Plant } from '../model/types'

export function getPlant(slug: string, signal?: AbortSignal) {
  return api.request<Plant>('GET', `/v1/plants/${encodeURIComponent(slug)}`, { signal })
}
