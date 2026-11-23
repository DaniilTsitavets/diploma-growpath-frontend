import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { formatDate, todayIso } from '@/features/journal/model/dates'
import {
  addDays,
  addMonths,
  clampIso,
  endOfWeek,
  formatDayName,
  formatMonthTitle,
  isOutOfRange,
  monthGrid,
  parseIso,
  startOfWeek,
} from '../lib/calendar'
import styles from './DatePicker.module.css'
import fieldStyles from './form-fields.module.css'
import { Icon } from './Icon'

interface DatePickerProps {
  id: string
  label: string
  /** ISO date (`YYYY-MM-DD`) or an empty string. */
  value: string
  onChange: (iso: string) => void
  min?: string
  max?: string
  hint?: string
  error?: string
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
}

const weekdays = [
  ['Sunday', 'SUN'],
  ['Monday', 'MON'],
  ['Tuesday', 'TUE'],
  ['Wednesday', 'WED'],
  ['Thursday', 'THU'],
  ['Friday', 'FRI'],
  ['Saturday', 'SAT'],
] as const

export function DatePicker({
  id,
  label,
  value,
  onChange,
  min,
  max,
  hint,
  error,
  placeholder = 'Choose a date',
  clearable = false,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const gridRef = useRef<HTMLTableElement>(null)
  const focusGrid = useRef(false)

  const today = todayIso()
  const hasValue = parseIso(value) !== null
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  useEffect(() => {
    if (!open || !focusGrid.current) return
    focusGrid.current = false
    gridRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus()
  }, [open, focused])

  useEffect(() => {
    if (!open) return
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

  function openPicker() {
    setFocused(clampIso(hasValue ? value : today, min, max))
    focusGrid.current = true
    setOpen(true)
  }

  function closePicker() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  function choose(iso: string) {
    if (isOutOfRange(iso, min, max)) return
    onChange(iso)
    closePicker()
  }

  function moveFocus(iso: string) {
    focusGrid.current = true
    setFocused(clampIso(iso, min, max))
  }

  function showMonth(months: number) {
    setFocused(clampIso(addMonths(focused, months), min, max))
  }

  function onDayKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const moves: Record<string, string> = {
      ArrowLeft: addDays(focused, -1),
      ArrowRight: addDays(focused, 1),
      ArrowUp: addDays(focused, -7),
      ArrowDown: addDays(focused, 7),
      PageUp: addMonths(focused, -1),
      PageDown: addMonths(focused, 1),
      Home: startOfWeek(focused),
      End: endOfWeek(focused),
    }
    const target = moves[event.key]
    if (!target) return
    event.preventDefault()
    moveFocus(target)
  }

  function onDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      closePicker()
    } else if (event.key === 'Tab') {
      // The popover follows the field in the DOM; closing here lets the next Tab continue from the field.
      event.preventDefault()
      closePicker()
    }
  }

  const weeks = open ? monthGrid(focused) : []

  return (
    <div className={fieldStyles.field}>
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <div ref={wrapperRef} className={styles.wrapper}>
        <button
          ref={triggerRef}
          id={id}
          type="button"
          className={styles.trigger}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined
          }
          onClick={() => (open ? setOpen(false) : openPicker())}
        >
          <span className={hasValue ? undefined : styles.placeholder}>
            {hasValue ? formatDate(value) : placeholder}
          </span>
          <Icon name="calendar" />
        </button>
        {open && (
          <div
            role="dialog"
            aria-label="Choose a date"
            className={styles.popover}
            onKeyDown={onDialogKeyDown}
          >
            <div className={styles.header}>
              <button
                type="button"
                className={styles.nav}
                aria-label="Previous month"
                onClick={() => showMonth(-1)}
              >
                <Icon name="chevron-left" />
              </button>
              <h2 className={styles.title} aria-live="polite">
                {formatMonthTitle(focused)}
              </h2>
              <button
                type="button"
                className={styles.nav}
                aria-label="Next month"
                onClick={() => showMonth(1)}
              >
                <Icon name="chevron-right" />
              </button>
            </div>
            <table ref={gridRef} role="grid" className={styles.grid} aria-label="Days">
              <thead>
                <tr>
                  {weekdays.map(([name, short]) => (
                    <th key={name} scope="col" abbr={name} className={styles.weekday}>
                      {short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week) => (
                  <tr key={week[0]?.iso}>
                    {week.map((day) => {
                      const selected = day.iso === value
                      const isToday = day.iso === today
                      const outOfRange = isOutOfRange(day.iso, min, max)
                      const classes = [
                        styles.day,
                        day.inMonth ? '' : styles.outside,
                        isToday ? styles.today : '',
                        selected ? styles.selected : '',
                      ]
                      return (
                        <td key={day.iso} role="gridcell" aria-selected={selected}>
                          <button
                            type="button"
                            className={classes.filter(Boolean).join(' ')}
                            tabIndex={day.iso === focused ? 0 : -1}
                            aria-label={formatDayName(day.iso)}
                            aria-current={isToday ? 'date' : undefined}
                            aria-disabled={outOfRange || undefined}
                            onClick={() => choose(day.iso)}
                            onKeyDown={onDayKeyDown}
                          >
                            {Number(day.iso.slice(8))}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {clearable && hasValue && (
              <div className={styles.footer}>
                <button
                  type="button"
                  className={styles.clear}
                  onClick={() => {
                    onChange('')
                    closePicker()
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {hint && (
        <p id={hintId} className={fieldStyles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={fieldStyles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
