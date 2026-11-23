import { api } from './client'

interface Page<T> {
  items: T[]
  next_cursor: string | null
}

const PAGE_LIMIT = 100
const MAX_PAGES = 20

/** Lists that are short by nature (the shop, a user's journals) are read to the end by following `next_cursor`. */
export async function listAllPages<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const items: T[] = []
  let cursor: string | undefined
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await api.request<Page<T>>('GET', path, {
      query: { limit: PAGE_LIMIT, cursor },
      signal,
    })
    items.push(...result.items)
    if (!result.next_cursor) break
    cursor = result.next_cursor
  }
  return items
}
