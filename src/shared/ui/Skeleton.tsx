import type { CSSProperties } from 'react'
import styles from './Skeleton.module.css'

interface SkeletonProps {
  width?: string
  height?: string
}

export function Skeleton({ width = '100%', height = '1rem' }: SkeletonProps) {
  const size: CSSProperties = { width, height }
  return <span className={styles.skeleton} style={size} aria-hidden="true" />
}
