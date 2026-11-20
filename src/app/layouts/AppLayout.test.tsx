import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { useSession } from '@/features/auth/model/session-store'
import { AppLayout } from './AppLayout'

function renderLayout(path = '/') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <h1>Home</h1> },
          { path: 'shop', element: <h1>Shop page</h1> },
          { path: 'login', element: <h1>Login page</h1> },
        ],
      },
    ],
    { initialEntries: [path] },
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
  it('shows the tabs and a Sign in link to a visitor, with no tab active on the home page', () => {
    renderLayout('/')

    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('link', { name: 'Shop' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument()
  })

  it('marks the open page tab as current', () => {
    renderLayout('/shop')
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('link', { name: 'Shop' })).toHaveAttribute('aria-current', 'page')
  })

  it('hides the Sign in link on the sign-in page', () => {
    renderLayout('/login')
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
  })

  it('shows Sign out and no expert link for a regular user', () => {
    signedIn(['users'])
    renderLayout()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Expert tickets' })).not.toBeInTheDocument()
  })

  it('shows the expert link for the experts group', () => {
    signedIn(['users', 'experts'])
    renderLayout()
    expect(screen.getByRole('link', { name: 'Expert tickets' })).toBeInTheDocument()
  })

  it('searches the shop from the header', async () => {
    renderLayout()
    await userEvent.type(screen.getByRole('searchbox', { name: /Search plants/ }), 'basil{Enter}')
    expect(await screen.findByRole('heading', { name: 'Shop page' })).toBeInTheDocument()
  })
})
