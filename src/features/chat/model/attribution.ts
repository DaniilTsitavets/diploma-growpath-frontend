import { safeHttpUrl } from './safe-url'
import type { ChatSource } from './types'

const PLANTSOLVE_HOST = 'www.plantsolve.com'

/** The licence of the care data asks for a visible credit with a link, so the first PlantSolve source is returned for it. */
export function plantSolveSource(sources: ChatSource[]): { href: string } | null {
  for (const source of sources) {
    const href = safeHttpUrl(source.source_url)
    if (href && new URL(href).hostname === PLANTSOLVE_HOST) return { href }
  }
  return null
}
