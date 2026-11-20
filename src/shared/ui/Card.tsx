import type { ComponentProps, ElementType } from 'react'
import styles from './Card.module.css'

type CardProps<T extends ElementType> = { as?: T } & Omit<ComponentProps<T>, 'as'>

/** A hairline-bordered surface: the one container style shared by lists, panels and forms. */
export function Card<T extends ElementType = 'div'>({ as, className = '', ...rest }: CardProps<T>) {
  const Component: ElementType = as ?? 'div'
  return <Component className={`${styles.card} ${className}`} {...rest} />
}
