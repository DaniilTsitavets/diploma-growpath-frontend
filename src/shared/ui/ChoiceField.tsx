import type { ComponentProps } from 'react'
import chips from './ChoiceChips.module.css'
import fields from './form-fields.module.css'

interface ChoiceFieldProps extends Omit<ComponentProps<'input'>, 'type' | 'value' | 'id'> {
  id: string
  label: string
  hint?: string
  options: Record<string, string>
  error?: string
}

/** A required single choice in a form: radios shown as chips, so there is no native dropdown to restyle. Works with `register`. */
export function ChoiceField({ id, label, hint, options, error, ...rest }: ChoiceFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  return (
    <fieldset
      className={chips.group}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={
        [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined
      }
    >
      <legend className={fields.legend}>{label}</legend>
      {hint && (
        <p id={hintId} className={fields.hint}>
          {hint}
        </p>
      )}
      <div className={chips.row}>
        {Object.entries(options).map(([value, text]) => (
          <label key={value} className={chips.choice}>
            <input
              type="radio"
              value={value}
              className={`visually-hidden ${chips.input}`}
              {...rest}
            />
            <span className={`${chips.text} ${error ? chips.invalid : ''}`}>{text}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className={fields.error}>
          {error}
        </p>
      )}
    </fieldset>
  )
}
