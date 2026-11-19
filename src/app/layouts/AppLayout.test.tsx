import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { useSession } from '@/features/auth/model/session-store'
import { AppLayout } from './AppLayout'

function renderLayout() {
  const router = createMemoryRouter(
    [{ path: '/', element: <AppLayout />, children: [{ index: true, element: <h1>Home</h1> }] }],
    { initialEntries: ['/'] },
  )
  render(<RouterProvider router={router} />)
}

function signedIn(groups: string[]) {
  useSession.setState({
    session: {
      idToken: 't',
      refreshToken: 'r',
      email: 'a@b.test',
      groups,
      expiresAt: Date.now() + 3_600_000,
    },
  })
}

afterEach(() => useSession.setState({ session: null }))

describe('AppLayout', () => {
  it('hides the main navigation before sign-in', () => {
    renderLayout()
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
  })

  it('shows the user navigation and no expert link for a regular user', () => {
    signedIn(['users'])
    renderLayout()
    expect(screen.getByRole('link', { name: 'Catalog' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Expert tickets' })).not.toBeInTheDocument()
  })

  it('shows the expert link for the experts group', () => {
    signedIn(['users', 'experts'])
    renderLayout()
    expect(screen.getByRole('link', { name: 'Expert tickets' })).toBeInTheDocument()
  })
})
