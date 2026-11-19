import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import styles from './Chip.module.css'

/** A static label such as a care need on a card. */
export function Tag({ className = '', ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={`${styles.tag} ${className}`} {...rest} />
}

interface ChipToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> {
  pressed: boolean
  /** Colour slot 1 to 6 for a decorative dot; the label text carries the meaning. */
  dot?: number
}

/** A filter chip: a toggle button whose state is announced through aria-pressed. */
export function ChipToggle({
  pressed,
  dot,
  className = '',
  type = 'button',
  children,
  ...rest
}: ChipToggleProps) {
  return (
    <button type={type} aria-pressed={pressed} className={`${styles.chip} ${className}`} {...rest}>
      {dot !== undefined && <span className={styles.dot} data-dot={dot} aria-hidden="true" />}
      {children}
    </button>
  )
}
