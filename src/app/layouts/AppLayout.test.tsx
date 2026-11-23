import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AppLayout } from './AppLayout'

function currentTab(path: string) {
  const router = createMemoryRouter(
    [{ path: '/', element: <AppLayout />, children: [{ path: '*', element: <p>page</p> }] }],
    { initialEntries: [path] },
  )
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return screen
    .getAllByRole('link', { current: 'page' })
    .map((link) => link.textContent)
    .join(',')
}

describe('AppLayout navigation', () => {
  it.each([
    ['/chat', 'AI chat'],
    ['/journals/abc/chat', 'AI chat'],
    ['/journals', 'Journals'],
    ['/journals/abc', 'Journals'],
    ['/journals/abc/updates/new', 'Journals'],
    ['/shop', 'Shop'],
  ])('marks only the right tab on %s', (path, tab) => {
    expect(currentTab(path)).toBe(tab)
  })
})
