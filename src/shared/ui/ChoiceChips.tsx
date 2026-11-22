import styles from './ChoiceChips.module.css'

interface ChoiceChipsProps<T extends string> {
  legend: string
  /** Shared by the radios of one group; it also makes the arrow keys move between the choices. */
  name: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}

/** A single choice shown as a row of chips: native radios underneath, so keyboard and screen readers just work. */
export function ChoiceChips<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: ChoiceChipsProps<T>) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.row}>
        {options.map((option) => (
          <label key={option.value} className={styles.choice}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className={`visually-hidden ${styles.input}`}
            />
            <span className={styles.text}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
