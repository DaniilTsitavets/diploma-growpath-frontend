import type { ComponentProps } from 'react'
import styles from './form-fields.module.css'

interface TextAreaFieldProps extends ComponentProps<'textarea'> {
  label: string
  hint?: string
  error?: string
}

export function TextAreaField({ label, hint, error, id, ...rest }: TextAreaFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        className={styles.input}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined
        }
        {...rest}
      />
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
