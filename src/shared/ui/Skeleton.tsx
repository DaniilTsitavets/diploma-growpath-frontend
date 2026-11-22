import styles from './Skeleton.module.css'

const heights = {
  line: '',
  heading: styles.heading,
  price: styles.price,
  title: styles.title,
  button: styles.button,
  row: styles.row,
  block: styles.block,
  panel: styles.panel,
}

const widths = {
  30: styles.w30,
  40: styles.w40,
  50: styles.w50,
  60: styles.w60,
  70: styles.w70,
  100: '',
}

interface SkeletonProps {
  /** A named height from the design kit, so no size is written inline. */
  height?: keyof typeof heights
  /** Width in percent of the container. */
  width?: keyof typeof widths
}

export function Skeleton({ height = 'line', width = 100 }: SkeletonProps) {
  const className = [styles.skeleton, heights[height], widths[width]].filter(Boolean).join(' ')
  return <span className={className} aria-hidden="true" />
}
