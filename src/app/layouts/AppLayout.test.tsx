import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AppLayout } from './AppLayout'

describe('AppLayout', () => {
  it('renders the main navigation and the routed page', () => {
    const router = createMemoryRouter(
      [{ path: '/', element: <AppLayout />, children: [{ index: true, element: <h1>Home</h1> }] }],
      { initialEntries: ['/'] },
    )
    render(<RouterProvider router={router} />)

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
  })
})
