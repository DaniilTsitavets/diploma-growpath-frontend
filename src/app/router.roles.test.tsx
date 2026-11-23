import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { useSession } from '@/features/auth/model/session-store'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { Providers } from './providers'
import { routes } from './router'

const origin = window.location.origin
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => 't', onUnauthorized: () => undefined }))
})
afterEach(() => {
  server.resetHandlers()
  useSession.setState({ session: null })
})
afterAll(() => server.close())

/** The interface follows what GET /v1/me answers, not the groups inside the token. */
function signInAs(role: 'user' | 'expert' | 'admin' | null) {
  server.use(
    http.get(`${origin}/v1/me`, () =>
      HttpResponse.json({ user_id: 'u1', role, groups: role ? [`${role}s`] : [] }),
    ),
  )
  useSession.setState({
    session: {
      idToken: 't',
      refreshToken: 'r',
      email: 'a@b.test',
      groups: [],
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

describe('roles', () => {
  it('shows an expert only the ticket queue in the navigation', async () => {
    signInAs('expert')
    server.use(
      http.get(`${origin}/v1/expert/tickets`, () =>
        HttpResponse.json({ items: [], next_cursor: null }),
      ),
    )
    renderAt('/expert/tickets')

    await screen.findByRole('heading', { name: 'Open tickets' })
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toHaveTextContent('Expert tickets')
    expect(nav).not.toHaveTextContent(/Shop|AI chat|Journals|Users/)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('shows an administrator only the users page in the navigation', async () => {
    signInAs('admin')
    server.use(
      http.get(`${origin}/v1/admin/users`, () =>
        HttpResponse.json({ items: [], next_cursor: null }),
      ),
    )
    renderAt('/admin/users')

    await screen.findByRole('heading', { name: 'Users', level: 1 })
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toHaveTextContent('Users')
    expect(nav).not.toHaveTextContent(/Shop|AI chat|Journals|Expert tickets/)
  })

  it.each([
    ['expert', '/expert/tickets'],
    ['admin', '/admin/users'],
  ] as const)('sends %s from the home page to their own page', async (role, home) => {
    signInAs(role)
    server.use(
      http.get(`${origin}/v1/expert/tickets`, () =>
        HttpResponse.json({ items: [], next_cursor: null }),
      ),
      http.get(`${origin}/v1/admin/users`, () =>
        HttpResponse.json({ items: [], next_cursor: null }),
      ),
    )
    const router = renderAt('/')

    await screen.findByRole('heading', { level: 1 })
    expect(router.state.location.pathname).toBe(home)
  })

  it.each(['/shop', '/journals', '/chat'])(
    'tells an expert there is no access to %s',
    async (path) => {
      signInAs('expert')
      renderAt(path)

      expect(await screen.findByRole('heading', { name: 'No access' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Open the tickets' })).toHaveAttribute(
        'href',
        '/expert/tickets',
      )
    },
  )

  it('keeps an expert and a customer out of the users page', async () => {
    signInAs('expert')
    renderAt('/admin/users')
    expect(await screen.findByRole('heading', { name: 'No access' })).toBeInTheDocument()
  })

  it('keeps the customer navigation for a user, and for a user in no group', async () => {
    signInAs(null)
    renderAt('/nothing-here')

    await screen.findByRole('heading', { name: 'Page not found' })
    const nav = await screen.findByRole('navigation', { name: 'Main' })
    expect(await within(nav).findByRole('link', { name: 'Journals' })).toBeInTheDocument()
    expect(nav).not.toHaveTextContent(/Expert tickets|Users/)
  })

  it('falls back to the groups of the token when /v1/me is not available', async () => {
    server.use(
      http.get(`${origin}/v1/me`, () =>
        HttpResponse.json({ message: 'Missing Authentication Token' }, { status: 403 }),
      ),
    )
    useSession.setState({
      session: {
        idToken: 't',
        refreshToken: 'r',
        email: 'e@b.test',
        groups: ['experts'],
        expiresAt: Date.now() + 3_600_000,
      },
    })
    renderAt('/shop')

    expect(
      await screen.findByRole('heading', { name: 'No access' }, { timeout: 4000 }),
    ).toBeInTheDocument()
  })
})
