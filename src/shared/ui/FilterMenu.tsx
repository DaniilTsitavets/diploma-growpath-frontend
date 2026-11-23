import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import styles from './FilterMenu.module.css'

interface FilterMenuProps {
  label: string
  /** How many options are ticked; the chip shows it as a badge and turns to the active look. */
  count?: number
  /** The chosen value for a single choice, shown after the label. */
  value?: string
  /** Marks the chip as active when it has no count, for example a sort other than the default. */
  active?: boolean
  onAll?: () => void
  onNone?: () => void
  children: ReactNode
}

const PANEL_WIDTH = 320
const EDGE = 16

/** A filter chip that opens a small menu under it; Escape, a click outside or leaving it with Tab closes it. */
export function FilterMenu({
  label,
  count = 0,
  value,
  active = false,
  onAll,
  onNone,
  children,
}: FilterMenuProps) {
  const [open, setOpen] = useState(false)
  const [alignEnd, setAlignEnd] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const highlighted = count > 0 || active

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function toggle() {
    if (!open && button.current) {
      const { left } = button.current.getBoundingClientRect()
      setAlignEnd(left + PANEL_WIDTH > window.innerWidth - EDGE)
    }
    setOpen(!open)
  }

  return (
    <div
      ref={root}
      className={styles.root}
      onBlur={(event) => {
        // A mouse press on a label moves focus to nothing; only a move to another element (Tab) closes the menu here.
        const next = event.relatedTarget
        if (open && next && !root.current?.contains(next)) setOpen(false)
      }}
    >
      <button
        ref={button}
        type="button"
        className={`${styles.chip} ${highlighted ? styles.active : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <span>{value ? `${label}: ${value}` : label}</span>
        {count > 0 && (
          <span className={styles.badge}>
            {count}
            <span className="visually-hidden"> selected</span>
          </span>
        )}
      </button>
      {open && (
        <div
          id={panelId}
          className={`${styles.panel} ${alignEnd ? styles.alignEnd : ''}`}
          role="group"
          aria-label={`${label} filter`}
        >
          {(onAll || onNone) && (
            <div className={styles.header}>
              <span className={styles.title}>{label}</span>
              <span className={styles.actions}>
                {onAll && (
                  <button type="button" className={styles.link} onClick={onAll}>
                    All
                  </button>
                )}
                {onNone && (
                  <button type="button" className={styles.link} onClick={onNone}>
                    None
                  </button>
                )}
              </span>
            </div>
          )}
          <div className={styles.body}>{children}</div>
        </div>
      )}
    </div>
  )
}
