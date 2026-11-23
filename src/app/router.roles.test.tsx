import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { useSession } from '@/features/auth/model/session-store'
import { Providers } from './providers'
import { routes } from './router'

function signInAs(groups: string[]) {
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

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  )
  return router
}

afterEach(() => useSession.setState({ session: null }))

describe('roles', () => {
  it('shows an expert only the ticket queue in the navigation', async () => {
    signInAs(['experts'])
    renderAt('/expert/tickets')

    await screen.findByRole('heading', { level: 1 })
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toHaveTextContent('Expert tickets')
    expect(nav).not.toHaveTextContent(/Shop|AI chat|Journals/)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('sends an expert from the home page to the ticket queue', async () => {
    signInAs(['experts'])
    const router = renderAt('/')

    await screen.findByRole('heading', { level: 1 })
    expect(router.state.location.pathname).toBe('/expert/tickets')
  })

  it.each(['/shop', '/journals', '/chat'])(
    'tells an expert there is no access to %s',
    async (path) => {
      signInAs(['experts'])
      renderAt(path)

      expect(await screen.findByRole('heading', { name: 'No access' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Open the tickets' })).toHaveAttribute(
        'href',
        '/expert/tickets',
      )
    },
  )

  it('keeps the customer navigation for a user outside the experts group', async () => {
    signInAs([])
    renderAt('/nothing-here')

    await screen.findByRole('heading', { name: 'Page not found' })
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toHaveTextContent('Shop')
    expect(nav).toHaveTextContent('Journals')
    expect(nav).not.toHaveTextContent('Expert tickets')
  })
})
