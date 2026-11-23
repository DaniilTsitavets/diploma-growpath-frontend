import { safeHttpUrl } from './safe-url'
import type { ChatSource } from './types'

export interface SourceCredit {
  name: string
  license: string | null
  /** The page of the first source with this name, or null when its address is not a web address. */
  href: string | null
}

/**
 * Who the sources of an answer come from, each name and licence once. The credit is read from the source
 * itself (`source_name`, `license`), so it follows whatever the backend uses and nothing is written here.
 */
export function sourceCredits(sources: ChatSource[]): SourceCredit[] {
  const credits = new Map<string, SourceCredit>()
  for (const source of sources) {
    if (!source.source_name) continue
    const key = `${source.source_name}|${source.license}`
    if (!credits.has(key)) {
      credits.set(key, {
        name: source.source_name,
        license: source.license ?? null,
        href: safeHttpUrl(source.source_url),
      })
    }
  }
  return [...credits.values()]
}
