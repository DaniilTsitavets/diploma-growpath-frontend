import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ChoiceChips } from './ChoiceChips'

const options = [
  { value: 'name', label: 'Name' },
  { value: 'price', label: 'Price' },
] as const

function Harness() {
  const [value, setValue] = useState<'name' | 'price'>('name')
  return (
    <ChoiceChips legend="Sort by" name="sort" value={value} options={options} onChange={setValue} />
  )
}

describe('ChoiceChips', () => {
  it('is a labelled group of radios with the current value checked', () => {
    render(<Harness />)

    expect(screen.getByRole('group', { name: 'Sort by' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Name' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Price' })).not.toBeChecked()
  })

  it('changes the choice by click and by the arrow keys', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole('radio', { name: 'Price' }))
    expect(screen.getByRole('radio', { name: 'Price' })).toBeChecked()

    screen.getByRole('radio', { name: 'Price' }).focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'Name' })).toBeChecked()
  })
})
