/** Every item picture is stored as <slug>.webp in the media bucket, one format for all. */
export const MEDIA_EXTENSION = 'webp'

export function normaliseMediaBaseUrl(raw: unknown): string | null {
  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim().replace(/\/+$/, '') : null
}

/** The bucket address from the environment, or null when pictures are not configured. */
export const mediaBaseUrl = () => normaliseMediaBaseUrl(import.meta.env.VITE_MEDIA_BASE_URL)

export const itemImageUrl = (base: string, slug: string) =>
  `${base}/${encodeURIComponent(slug)}.${MEDIA_EXTENSION}`

export const creditsUrl = (base: string) => `${base}/credits.json`
