import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { DatePicker } from './DatePicker'

interface HarnessProps {
  initial?: string
  min?: string
  max?: string
  clearable?: boolean
  onChange?: (iso: string) => void
}

function Harness({ initial = '', min, max, clearable, onChange }: HarnessProps) {
  const [value, setValue] = useState(initial)
  return (
    <DatePicker
      id="when"
      label="When"
      value={value}
      min={min}
      max={max}
      clearable={clearable}
      hint="Pick the day."
      onChange={(iso) => {
        setValue(iso)
        onChange?.(iso)
      }}
    />
  )
}

function setup(props: HarnessProps = {}) {
  const user = userEvent.setup()
  render(<Harness {...props} />)
  return { user, field: screen.getByLabelText('When') }
}

describe('DatePicker', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 23, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the placeholder or the formatted value on a labelled button', () => {
    setup()
    const field = screen.getByRole('button', { name: /When/ })
    expect(field).toHaveTextContent('Choose a date')
    expect(field).toHaveAttribute('aria-haspopup', 'dialog')
    expect(field).toHaveAttribute('aria-expanded', 'false')
    expect(field).toHaveAccessibleDescription('Pick the day.')
  })

  it('shows a saved value as text', () => {
    setup({ initial: '2026-11-07' })
    expect(screen.getByLabelText('When')).toHaveTextContent('Nov 7, 2026')
  })

  it('opens a named, non-modal dialog on the current month and focuses the day', async () => {
    const { user, field } = setup()
    await user.click(field)
    const dialog = screen.getByRole('dialog', { name: 'Choose a date' })
    expect(dialog).not.toHaveAttribute('aria-modal')
    expect(field).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('November 2026')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getAllByRole('columnheader')).toHaveLength(7)
    expect(screen.getByRole('button', { name: 'November 23, 2026' })).toHaveFocus()
  })

  it('marks today and the selected day', async () => {
    const { user, field } = setup({ initial: '2026-11-07' })
    await user.click(field)
    expect(screen.getByRole('button', { name: 'November 23, 2026' })).toHaveAttribute(
      'aria-current',
      'date',
    )
    const selected = screen.getByRole('button', { name: 'November 7, 2026' })
    expect(selected.closest('td')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: 'November 8, 2026' }).closest('td')).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('chooses a day, reports the ISO date, closes and returns focus', async () => {
    const onChange = vi.fn()
    const { user, field } = setup({ onChange })
    await user.click(field)
    await user.click(screen.getByRole('button', { name: 'November 5, 2026' }))
    expect(onChange).toHaveBeenCalledWith('2026-11-05')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(field).toHaveTextContent('Nov 5, 2026')
    expect(field).toHaveFocus()
  })

  it('moves between months with the chevron buttons', async () => {
    const { user, field } = setup()
    await user.click(field)
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByText('December 2026')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByText('October 2026')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'October 9, 2026' }))
    expect(field).toHaveTextContent('Oct 9, 2026')
  })

  it('shows days of the neighbouring months and lets them be chosen', async () => {
    const { user, field } = setup()
    await user.click(field)
    await user.click(screen.getByRole('button', { name: 'December 1, 2026' }))
    expect(field).toHaveTextContent('Dec 1, 2026')
  })

  it('disables days outside min and max', async () => {
    const onChange = vi.fn()
    const { user, field } = setup({ min: '2026-11-10', max: '2026-11-23', onChange })
    await user.click(field)
    const early = screen.getByRole('button', { name: 'November 9, 2026' })
    const late = screen.getByRole('button', { name: 'November 24, 2026' })
    expect(early).toHaveAttribute('aria-disabled', 'true')
    expect(late).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'November 10, 2026' })).not.toHaveAttribute(
      'aria-disabled',
    )
    await user.click(late)
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('keeps keyboard focus inside the allowed range', async () => {
    const { user, field } = setup({ max: '2026-11-23' })
    await user.click(field)
    await user.keyboard('{ArrowRight}{ArrowDown}')
    expect(screen.getByRole('button', { name: 'November 23, 2026' })).toHaveFocus()
  })

  it('moves focus with arrows, Home, End and Page keys', async () => {
    const { user, field } = setup()
    await user.click(field)
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('button', { name: 'November 22, 2026' })).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('button', { name: 'November 15, 2026' })).toHaveFocus()
    await user.keyboard('{ArrowDown}{ArrowRight}')
    expect(screen.getByRole('button', { name: 'November 23, 2026' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('button', { name: 'November 22, 2026' })).toHaveFocus()
    await user.keyboard('{End}')
    expect(screen.getByRole('button', { name: 'November 28, 2026' })).toHaveFocus()
    await user.keyboard('{PageDown}')
    expect(screen.getByText('December 2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'December 28, 2026' })).toHaveFocus()
    await user.keyboard('{PageUp}{PageUp}')
    expect(screen.getByText('October 2026')).toBeInTheDocument()
  })

  it('keeps one day in the tab order', async () => {
    const { user, field } = setup()
    await user.click(field)
    const tabbable = screen
      .getAllByRole('button')
      .filter((button) => button.getAttribute('tabindex') === '0')
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]).toHaveAccessibleName('November 23, 2026')
  })

  it('chooses the focused day with Enter and with Space', async () => {
    const { user, field } = setup()
    await user.click(field)
    await user.keyboard('{ArrowLeft}{Enter}')
    expect(field).toHaveTextContent('Nov 22, 2026')
    await user.click(field)
    await user.keyboard('{ArrowLeft}{ }')
    expect(field).toHaveTextContent('Nov 21, 2026')
  })

  it('closes on Escape and returns focus to the field', async () => {
    const { user, field } = setup()
    await user.click(field)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(field).toHaveFocus()
    expect(field).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes on Tab and on a click outside', async () => {
    const { user, field } = setup()
    await user.click(field)
    await user.tab()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(field).toHaveFocus()
    await user.click(field)
    await user.click(document.body)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clears an optional value', async () => {
    const onChange = vi.fn()
    const { user, field } = setup({ initial: '2026-11-07', clearable: true, onChange })
    await user.click(field)
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onChange).toHaveBeenCalledWith('')
    expect(field).toHaveTextContent('Choose a date')
  })

  it('offers Clear only for clearable fields that have a value', async () => {
    const { user, field } = setup({ initial: '2026-11-07' })
    await user.click(field)
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
  })
})
