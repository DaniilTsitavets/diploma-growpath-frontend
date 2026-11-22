import packDark from '@/assets/placeholders/pack-dark.webp'
import packLight from '@/assets/placeholders/pack-light.webp'
import sensorDark from '@/assets/placeholders/sensor-dark.webp'
import sensorLight from '@/assets/placeholders/sensor-light.webp'
import { useTheme } from '@/shared/theme/theme-store'
import type { ImagePriority } from '../model/image-priority'
import styles from './ItemImage.module.css'

const placeholders = {
  pack: { light: packLight, dark: packDark },
  sensor: { light: sensorLight, dark: sensorDark },
}

interface ItemImageProps {
  itemType: string
  /** `high` for the one picture that is likely the largest on screen, `lazy` for cards below the fold. */
  priority?: ImagePriority
}

/** Decorative: the item name next to it already says what it is. Only the picture of the active theme is loaded. */
export function ItemImage({ itemType, priority = 'lazy' }: ItemImageProps) {
  const theme = useTheme((state) => state.theme)
  const source = placeholders[itemType === 'sensor' ? 'sensor' : 'pack'][theme]
  return (
    <span className={styles.frame}>
      <img
        className={styles.image}
        src={source}
        alt=""
        width={512}
        height={384}
        loading={priority === 'lazy' ? 'lazy' : undefined}
        fetchPriority={priority === 'high' ? 'high' : undefined}
      />
    </span>
  )
}
