import type { ReactNode } from 'react'
import { Icon } from './Icon'
import styles from './OptionGroup.module.css'

export interface Option<T extends string> {
  value: T
  label: string
  /** Colour slot 1 to 6 for a decorative dot; the label text carries the meaning. */
  dot?: number
}

interface GroupFrameProps {
  legend: string
  hint?: string
  compact?: boolean
  children: ReactNode
}

function GroupFrame({ legend, hint, compact = false, children }: GroupFrameProps) {
  return (
    <fieldset className={styles.group}>
      <legend className={compact ? 'visually-hidden' : styles.legend}>{legend}</legend>
      {hint && <p className={styles.hint}>{hint}</p>}
      <div className={compact ? styles.list : styles.grid}>{children}</div>
    </fieldset>
  )
}

interface OptionRowProps {
  type: 'checkbox' | 'radio'
  name: string
  value: string
  label: string
  dot?: number
  checked: boolean
  onChange: () => void
}

function OptionRow({ type, name, value, label, dot, checked, onChange }: OptionRowProps) {
  return (
    <label className={styles.option}>
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className={`visually-hidden ${styles.input}`}
      />
      <span className={`${styles.box} ${type === 'radio' ? styles.round : ''}`} aria-hidden="true">
        {type === 'checkbox' && <Icon name="tick" size={14} className={styles.tick} />}
      </span>
      {dot !== undefined && <span className={styles.dot} data-dot={dot} aria-hidden="true" />}
      <span>{label}</span>
    </label>
  )
}

interface CheckboxGroupProps<T extends string> {
  legend: string
  hint?: string
  /** One narrow column and a visually hidden legend, for a menu that already names the group. */
  compact?: boolean
  name: string
  values: readonly T[]
  options: readonly Option<T>[]
  onChange: (values: T[]) => void
}

/** Several options can be ticked at once; native checkboxes underneath. */
export function CheckboxGroup<T extends string>({
  legend,
  hint,
  compact,
  name,
  values,
  options,
  onChange,
}: CheckboxGroupProps<T>) {
  function toggle(value: T) {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value])
  }
  return (
    <GroupFrame legend={legend} hint={hint} compact={compact}>
      {options.map((option) => (
        <OptionRow
          key={option.value}
          type="checkbox"
          name={name}
          value={option.value}
          label={option.label}
          dot={option.dot}
          checked={values.includes(option.value)}
          onChange={() => toggle(option.value)}
        />
      ))}
    </GroupFrame>
  )
}

interface RadioGroupProps<T extends string> {
  legend: string
  hint?: string
  compact?: boolean
  /** Shared by the radios of one group; it also makes the arrow keys move between the choices. */
  name: string
  value: T
  options: readonly Option<T>[]
  onChange: (value: T) => void
}

/** A single choice in the same look as CheckboxGroup. */
export function RadioGroup<T extends string>({
  legend,
  hint,
  compact,
  name,
  value,
  options,
  onChange,
}: RadioGroupProps<T>) {
  return (
    <GroupFrame legend={legend} hint={hint} compact={compact}>
      {options.map((option) => (
        <OptionRow
          key={option.value}
          type="radio"
          name={name}
          value={option.value}
          label={option.label}
          dot={option.dot}
          checked={option.value === value}
          onChange={() => onChange(option.value)}
        />
      ))}
    </GroupFrame>
  )
}
