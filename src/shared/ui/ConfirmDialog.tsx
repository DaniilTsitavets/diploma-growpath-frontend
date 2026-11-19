import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './Button'
import styles from './ConfirmDialog.module.css'

interface ConfirmDialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  pending?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** A modal confirmation: Cancel is focused first because the confirmed action cannot be undone. */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  pending = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog ref={ref} className={styles.dialog} aria-labelledby="confirm-title" onClose={onClose}>
      <h2 id="confirm-title" className={styles.title}>
        {title}
      </h2>
      {children}
      <form method="dialog" className={styles.actions}>
        <Button type="submit" variant="secondary" autoFocus>
          Cancel
        </Button>
        <Button disabled={pending} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </form>
    </dialog>
  )
}
