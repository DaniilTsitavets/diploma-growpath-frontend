import packDark from '@/assets/placeholders/pack-dark.webp'
import packLight from '@/assets/placeholders/pack-light.webp'
import sensorDark from '@/assets/placeholders/sensor-dark.webp'
import sensorLight from '@/assets/placeholders/sensor-light.webp'
import styles from './ItemImage.module.css'

const placeholders = {
  pack: { light: packLight, dark: packDark },
  sensor: { light: sensorLight, dark: sensorDark },
}

/** Decorative: the item name next to it already says what it is. */
export function ItemImage({ itemType }: { itemType: string }) {
  const { light, dark } = placeholders[itemType === 'sensor' ? 'sensor' : 'pack']
  return (
    <span className={styles.frame}>
      <img className={`${styles.image} ${styles.light}`} src={light} alt="" loading="lazy" />
      <img className={`${styles.image} ${styles.dark}`} src={dark} alt="" loading="lazy" />
    </span>
  )
}
