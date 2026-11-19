import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { useSession } from '../model/session-store'
import { LoginPage } from './LoginPage'

vi.mock('@/shared/config/config', () => ({
  getConfig: () => ({
    cognitoEndpoint: 'http://cognito.test',
    cognitoClientId: 'client',
  }),
}))

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  useSession.getState().clear()
})
afterAll(() => server.close())

function idToken(groups: string[]) {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '')
  const exp = Math.floor(Date.now() / 1000) + 3600
  return `${encode({ alg: 'none' })}.${encode({ sub: 'u', email: 'a@b.test', 'cognito:groups': groups, exp })}.s`
}

function renderLogin() {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      { path: '/catalog', element: <h1>Catalog page</h1> },
    ],
    { initialEntries: ['/login'] },
  )
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('LoginPage', () => {
  it('validates the fields before calling Cognito', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('stores the session and opens the catalog on success', async () => {
    server.use(
      http.post('http://cognito.test/', () =>
        HttpResponse.json({
          AuthenticationResult: { IdToken: idToken(['users']), RefreshToken: 'refresh' },
        }),
      ),
    )
    renderLogin()
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.test')
    await userEvent.type(screen.getByLabelText('Password'), 'secret')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { name: 'Catalog page' })).toBeInTheDocument()
    expect(useSession.getState().session?.email).toBe('a@b.test')
  })

  it('shows a clear message for wrong credentials', async () => {
    server.use(
      http.post('http://cognito.test/', () =>
        HttpResponse.json(
          { __type: 'NotAuthorizedException', message: 'Incorrect username or password.' },
          { status: 400 },
        ),
      ),
    )
    renderLogin()
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.test')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Incorrect email or password.'),
    )
    expect(useSession.getState().session).toBeNull()
  })
})
