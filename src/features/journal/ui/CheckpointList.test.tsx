import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { CheckpointList } from './CheckpointList'
import type { Checkpoint } from '../model/types'

const checkpoints: Checkpoint[] = [
  { number: 1, opens_on: '2026-11-01', closes_on: '2026-11-03', state: 'passed' },
  { number: 2, opens_on: '2026-11-05', closes_on: '2026-11-07', state: 'open' },
  { number: 3, opens_on: '2026-11-10', closes_on: '2026-11-12', state: 'upcoming' },
] as Checkpoint[]

describe('CheckpointList', () => {
  it('makes only the open checkpoint an action, leading to a new update', () => {
    render(
      <MemoryRouter>
        <CheckpointList journalId="j1" checkpoints={checkpoints} />
      </MemoryRouter>,
    )

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAccessibleName('Add update for checkpoint 2')
    expect(links[0]).toHaveAttribute('href', '/journals/j1/updates/new')
    expect(screen.getByText('Open now')).toBeInTheDocument()
    expect(screen.getByText('Passed')).toBeInTheDocument()
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
  })
})
