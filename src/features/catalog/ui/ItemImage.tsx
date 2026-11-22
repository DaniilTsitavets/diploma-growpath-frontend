import { useState } from 'react'
import packDark from '@/assets/placeholders/pack-dark.webp'
import packLight from '@/assets/placeholders/pack-light.webp'
import sensorDark from '@/assets/placeholders/sensor-dark.webp'
import sensorLight from '@/assets/placeholders/sensor-light.webp'
import { useMediaCredits } from '@/features/media/api/use-media-credits'
import { itemImageUrl, mediaBaseUrl } from '@/shared/config/media'
import { useTheme } from '@/shared/theme/theme-store'
import type { ImagePriority } from '../model/image-priority'
import styles from './ItemImage.module.css'

const placeholders = {
  pack: { light: packLight, dark: packDark },
  sensor: { light: sensorLight, dark: sensorDark },
}

interface ItemImageProps {
  itemType: string
  /** The item's slug: its picture is <media>/<slug>.webp when the credits list says one exists. */
  slug: string
  /** `high` for the one picture that is likely the largest on screen, `lazy` for cards below the fold. */
  priority?: ImagePriority
}

/** Decorative: the item name next to it already says what it is. Only the picture of the active theme is loaded. */
export function ItemImage({ itemType, slug, priority = 'lazy' }: ItemImageProps) {
  const theme = useTheme((state) => state.theme)
  const credits = useMediaCredits()
  const [failedSlug, setFailedSlug] = useState<string | null>(null)

  const base = mediaBaseUrl()
  const hasPhoto = base !== null && credits.data?.some((credit) => credit.slug === slug) === true
  const photo = hasPhoto && failedSlug !== slug ? itemImageUrl(base, slug) : null
  const source = photo ?? placeholders[itemType === 'sensor' ? 'sensor' : 'pack'][theme]

  return (
    <span className={styles.frame}>
      <img
        className={styles.image}
        src={source}
        alt=""
        width={410}
        height={512}
        loading={priority === 'lazy' ? 'lazy' : undefined}
        fetchPriority={priority === 'high' ? 'high' : undefined}
        onError={photo ? () => setFailedSlug(slug) : undefined}
      />
    </span>
  )
}
