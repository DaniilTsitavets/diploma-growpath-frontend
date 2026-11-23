import { useEffect, useRef, type FormEventHandler, type ReactNode } from 'react'
import { Button } from './Button'
import styles from './ConfirmDialog.module.css'

interface FormDialogProps {
  title: string
  children: ReactNode
  submitLabel: string
  pending?: boolean
  /** Shown above the buttons, for an error of the submitted operation. */
  error?: string | null
  onSubmit: FormEventHandler<HTMLFormElement>
  onClose: () => void
}

/** A modal that holds a form: Enter submits, Escape and Cancel close it. */
export function FormDialog({
  title,
  children,
  submitLabel,
  pending = false,
  error,
  onSubmit,
  onClose,
}: FormDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="form-dialog-title"
      onClose={onClose}
    >
      <h2 id="form-dialog-title" className={styles.title}>
        {title}
      </h2>
      <form noValidate onSubmit={onSubmit}>
        <div className={styles.body}>{children}</div>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Working…' : submitLabel}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
