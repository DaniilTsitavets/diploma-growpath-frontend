import type { ComponentProps } from 'react'
import styles from './form-fields.module.css'

interface SelectFieldProps extends ComponentProps<'select'> {
  label: string
  options: Record<string, string>
  error?: string
}

export function SelectField({ label, options, error, id, ...rest }: SelectFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className={styles.input}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      >
        <option value="">Choose…</option>
        {Object.entries(options).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
