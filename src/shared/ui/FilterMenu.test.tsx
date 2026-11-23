import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { FilterMenu } from './FilterMenu'
import { CheckboxGroup } from './OptionGroup'

function Example() {
  const [values, setValues] = useState<string[]>([])
  return (
    <>
      <FilterMenu
        label="Pets"
        count={values.length}
        onAll={() => setValues(['a', 'b'])}
        onNone={() => setValues([])}
      >
        <CheckboxGroup
          compact
          legend="Pets"
          name="pets"
          values={values}
          options={[
            { value: 'a', label: 'pet-safe' },
            { value: 'b', label: 'toxic-to-pets' },
          ]}
          onChange={setValues}
        />
      </FilterMenu>
      <button type="button">Elsewhere</button>
    </>
  )
}

describe('FilterMenu', () => {
  it('opens under the chip and closes with Escape, returning focus to the chip', async () => {
    render(<Example />)
    const chip = screen.getByRole('button', { name: 'Pets' })
    expect(chip).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(chip)
    expect(chip).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('group', { name: 'Pets filter' })).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('group', { name: 'Pets filter' })).not.toBeInTheDocument()
    expect(chip).toHaveFocus()
  })

  it('stays open and ticks the box when the label text is pressed with the mouse', async () => {
    render(<Example />)
    await userEvent.click(screen.getByRole('button', { name: 'Pets' }))

    await userEvent.click(screen.getByText('pet-safe'))

    expect(screen.getByRole('checkbox', { name: 'pet-safe' })).toBeChecked()
    expect(screen.getByRole('button', { name: /^Pets\s*1/ })).toBeInTheDocument()
  })

  it('closes on a click outside and when focus tabs away', async () => {
    render(<Example />)
    await userEvent.click(screen.getByRole('button', { name: 'Pets' }))
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(screen.queryByRole('group', { name: 'Pets filter' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Pets' }))
    act(() => screen.getByRole('button', { name: 'Elsewhere' }).focus())
    expect(screen.queryByRole('group', { name: 'Pets filter' })).not.toBeInTheDocument()
  })

  it('ticks everything with All and clears it with None', async () => {
    render(<Example />)
    await userEvent.click(screen.getByRole('button', { name: 'Pets' }))

    await userEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getAllByRole('checkbox').every((box) => (box as HTMLInputElement).checked)).toBe(
      true,
    )

    await userEvent.click(screen.getByRole('button', { name: 'None' }))
    expect(screen.getAllByRole('checkbox').some((box) => (box as HTMLInputElement).checked)).toBe(
      false,
    )
  })
})
