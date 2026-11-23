import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { useSession } from '@/features/auth/model/session-store'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { UsersPage } from './UsersPage'

const origin = window.location.origin
const server = setupServer()

const user = (
  id: string,
  email: string,
  role: 'user' | 'expert' | 'admin' | null,
  enabled = true,
) => ({
  user_id: id,
  username: id,
  email,
  role,
  enabled,
  created_at: '2026-11-01T10:00:00Z',
})

const page = (items: ReturnType<typeof user>[], next_cursor: string | null = null) => ({
  items,
  next_cursor,
})

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  configureApi(createHttpClient({ getToken: () => 't', onUnauthorized: () => undefined }))
})
beforeEach(() => {
  useSession.setState({
    session: {
      idToken: 't',
      refreshToken: 'r',
      email: 'admin@x.test',
      groups: [],
      expiresAt: Date.now() + 3_600_000,
    },
  })
  server.use(
    http.get(`${origin}/v1/me`, () =>
      HttpResponse.json({ user_id: 'me', role: 'admin', groups: ['admins'] }),
    ),
  )
})
afterEach(() => {
  server.resetHandlers()
  useSession.setState({ session: null })
})
afterAll(() => server.close())

function renderPage() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <UsersPage />
    </QueryClientProvider>,
  )
}

describe('UsersPage', () => {
  it('lists the users with role and status, and keeps the administrator from changing their own role or status', async () => {
    server.use(
      http.get(`${origin}/v1/admin/users`, () =>
        HttpResponse.json(
          page([user('me', 'admin@x.test', 'admin'), user('u2', 'ann@x.test', 'expert', false)]),
        ),
      ),
    )
    renderPage()

    const row = (await screen.findByText('ann@x.test')).closest('tr') as HTMLElement
    expect(within(row).getByText('Expert')).toBeInTheDocument()
    expect(within(row).getByText('Disabled')).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Enable ann@x.test' })).toBeEnabled()

    expect(screen.getByText('(you)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change role of admin@x.test' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Disable admin@x.test' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reset password of admin@x.test' })).toBeEnabled()
  })

  it('filters the loaded users by email and loads the next page', async () => {
    const cursors: (string | null)[] = []
    server.use(
      http.get(`${origin}/v1/admin/users`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        cursors.push(cursor)
        return HttpResponse.json(
          cursor
            ? page([user('u3', 'zed@x.test', 'user')])
            : page([user('u2', 'ann@x.test', 'user')], 'c1'),
        )
      }),
    )
    renderPage()

    await screen.findByText('ann@x.test')
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(await screen.findByText('zed@x.test')).toBeInTheDocument()
    expect(cursors).toEqual([null, 'c1'])

    await userEvent.type(screen.getByLabelText('Search by email'), 'zed')
    expect(screen.queryByText('ann@x.test')).not.toBeInTheDocument()
    expect(screen.getByText('1 user')).toBeInTheDocument()
  })

  it('creates a user and shows the new list', async () => {
    let created: unknown
    let users = [user('me', 'admin@x.test', 'admin')]
    server.use(
      http.get(`${origin}/v1/admin/users`, () => HttpResponse.json(page(users))),
      http.post(`${origin}/v1/admin/users`, async ({ request }) => {
        created = await request.json()
        users = [...users, user('u9', 'new@x.test', 'expert')]
        return HttpResponse.json(users[1], { status: 201 })
      }),
    )
    renderPage()
    await screen.findByText('admin@x.test')

    await userEvent.click(screen.getByRole('button', { name: 'Create user' }))
    await userEvent.type(screen.getByLabelText('Email'), 'new@x.test')
    await userEvent.type(screen.getByLabelText('Temporary password'), 'Secret-123!')
    await userEvent.click(screen.getByRole('radio', { name: 'Expert' }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Create user' }),
    )

    expect(await screen.findByText('new@x.test')).toBeInTheDocument()
    expect(created).toEqual({ email: 'new@x.test', password: 'Secret-123!', role: 'expert' })
  })

  it('validates the form and explains an email that is already taken', async () => {
    server.use(
      http.get(`${origin}/v1/admin/users`, () =>
        HttpResponse.json(page([user('me', 'admin@x.test', 'admin')])),
      ),
      http.post(`${origin}/v1/admin/users`, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, code: 'user-exists' },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderPage()
    await screen.findByText('admin@x.test')
    await userEvent.click(screen.getByRole('button', { name: 'Create user' }))
    const dialog = screen.getByRole('dialog')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Create user' }))
    expect(await within(dialog).findByText('Enter an email')).toBeInTheDocument()
    expect(within(dialog).getByText('Enter a temporary password')).toBeInTheDocument()

    await userEvent.type(within(dialog).getByLabelText('Email'), 'ann@x.test')
    await userEvent.type(within(dialog).getByLabelText('Temporary password'), 'Secret-123!')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create user' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('already exists')
  })

  it('disables a user after a confirmation', async () => {
    let disabled = false
    server.use(
      http.get(`${origin}/v1/admin/users`, () =>
        HttpResponse.json(
          page([user('me', 'admin@x.test', 'admin'), user('u2', 'ann@x.test', 'user', !disabled)]),
        ),
      ),
      http.post(`${origin}/v1/admin/users/u2/disable`, () => {
        disabled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Disable ann@x.test' }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Disable user' }),
    )

    expect(await screen.findByRole('button', { name: 'Enable ann@x.test' })).toBeInTheDocument()
  })

  it('sets a new password and explains a refused one', async () => {
    server.use(
      http.get(`${origin}/v1/admin/users`, () =>
        HttpResponse.json(page([user('u2', 'ann@x.test', 'user')])),
      ),
      http.post(`${origin}/v1/admin/users/u2/password`, () =>
        HttpResponse.json(
          { title: 'Unprocessable', status: 422, code: 'invalid-password' },
          { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderPage()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Reset password of ann@x.test' }),
    )
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('New password'), 'x')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Set password' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('password policy')
  })
})
