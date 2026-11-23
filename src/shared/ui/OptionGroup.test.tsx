import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { CheckboxGroup, RadioGroup } from './OptionGroup'

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta', dot: 2 },
] as const

function CheckboxHarness() {
  const [values, setValues] = useState<('a' | 'b')[]>([])
  return (
    <CheckboxGroup
      legend="Letters"
      hint="Pick some."
      name="l"
      values={values}
      options={options}
      onChange={setValues}
    />
  )
}

function RadioHarness() {
  const [value, setValue] = useState<'a' | 'b'>('a')
  return <RadioGroup legend="One" name="one" value={value} options={options} onChange={setValue} />
}

describe('CheckboxGroup', () => {
  it('is a labelled group with the hint and unchecked boxes', () => {
    render(<CheckboxHarness />)

    expect(screen.getByRole('group', { name: 'Letters' })).toBeInTheDocument()
    expect(screen.getByText('Pick some.')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Alpha' })).not.toBeChecked()
  })

  it('ticks several options by click and toggles one with the space key', async () => {
    render(<CheckboxHarness />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Alpha' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Beta' }))
    expect(screen.getByRole('checkbox', { name: 'Alpha' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Beta' })).toBeChecked()

    screen.getByRole('checkbox', { name: 'Alpha' }).focus()
    await userEvent.keyboard(' ')
    expect(screen.getByRole('checkbox', { name: 'Alpha' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Beta' })).toBeChecked()
  })
})

describe('RadioGroup', () => {
  it('keeps exactly one choice and moves it with the arrow keys', async () => {
    render(<RadioHarness />)

    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked()
    screen.getByRole('radio', { name: 'Alpha' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'Beta' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Alpha' })).not.toBeChecked()
  })
})
