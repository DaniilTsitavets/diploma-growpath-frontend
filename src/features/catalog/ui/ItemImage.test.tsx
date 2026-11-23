import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { useTheme } from '@/shared/theme/theme-store'
import { ItemImage } from './ItemImage'

const media = 'http://media.test/bucket'
const server = setupServer()

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  vi.unstubAllEnvs()
  useTheme.setState({ theme: 'light' })
})
afterAll(() => server.close())

function renderImage(props: Partial<Parameters<typeof ItemImage>[0]> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const { container } = render(
    <QueryClientProvider client={client}>
      <ItemImage itemType="pack" slug="aloe-vera" {...props} />
    </QueryClientProvider>,
  )
  return container.querySelector('img') as HTMLImageElement
}

describe('ItemImage placeholders', () => {
  it('shows the leaves for a pack and the gears for a sensor', () => {
    expect(renderImage().getAttribute('src')).toContain('pack-light')
    expect(
      renderImage({ itemType: 'sensor', slug: 'thermo-hygrometer' }).getAttribute('src'),
    ).toContain('sensor-light')
  })

  it('loads only the picture of the active theme', () => {
    useTheme.setState({ theme: 'dark' })
    const img = renderImage()

    expect(document.querySelectorAll('img')).toHaveLength(1)
    expect(img.getAttribute('src')).toContain('pack-dark')
  })

  it('falls back to the pack picture and hides it from screen readers', () => {
    const img = renderImage({ itemType: 'mystery' })
    expect(img.getAttribute('src')).toContain('pack-light')
    expect(img.getAttribute('alt')).toBe('')
  })

  it('reserves a 4:5 box, so the card does not jump when it loads', () => {
    const img = renderImage()
    expect(img).toHaveAttribute('width', '410')
    expect(img).toHaveAttribute('height', '512')
  })

  it('applies the priority it is given', () => {
    expect(renderImage({ priority: 'high' })).toHaveAttribute('fetchpriority', 'high')
    expect(renderImage({ priority: 'normal' })).not.toHaveAttribute('loading')
    expect(renderImage({ priority: 'lazy' })).toHaveAttribute('loading', 'lazy')
  })
})

describe('ItemImage photos', () => {
  const credits = [
    {
      slug: 'lavender',
      key: 'lavender.webp',
      author: 'A',
      license: 'L',
      source: 'https://x.test/p',
    },
  ]

  it('shows the photo of an item that has one in the credits list', async () => {
    vi.stubEnv('VITE_MEDIA_BASE_URL', media)
    server.use(http.get(`${media}/credits.json`, () => HttpResponse.json(credits)))
    renderImage({ slug: 'lavender' })

    await waitFor(() =>
      expect(document.querySelector('img')).toHaveAttribute('src', `${media}/lavender.webp`),
    )
  })

  it('keeps the placeholder for an item without a photo, with no request for the missing file', async () => {
    vi.stubEnv('VITE_MEDIA_BASE_URL', media)
    server.use(http.get(`${media}/credits.json`, () => HttpResponse.json(credits)))
    const img = renderImage({ slug: 'aloe-vera' })

    await waitFor(() => expect(img.getAttribute('src')).toContain('pack-light'))
  })

  it('goes back to the placeholder when the photo fails to load', async () => {
    vi.stubEnv('VITE_MEDIA_BASE_URL', media)
    server.use(http.get(`${media}/credits.json`, () => HttpResponse.json(credits)))
    renderImage({ slug: 'lavender' })
    await waitFor(() =>
      expect(document.querySelector('img')).toHaveAttribute('src', `${media}/lavender.webp`),
    )

    fireEvent.error(document.querySelector('img') as HTMLImageElement)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(document.querySelector('img')?.getAttribute('src')).toContain('pack-light')
  })

  it('shows the placeholder while the media bucket is not configured', () => {
    expect(renderImage({ slug: 'lavender' }).getAttribute('src')).toContain('pack-light')
  })
})

describe('ItemImage credits request', () => {
  it('asks for the credits list once, however many pictures are on the page', async () => {
    vi.stubEnv('VITE_MEDIA_BASE_URL', media)
    let requests = 0
    server.use(
      http.get(`${media}/credits.json`, () => {
        requests += 1
        return HttpResponse.json([])
      }),
    )
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        {['a', 'b', 'c', 'd'].map((slug) => (
          <ItemImage key={slug} itemType="pack" slug={slug} />
        ))}
      </QueryClientProvider>,
    )

    await waitFor(() => expect(requests).toBe(1))
    expect(document.querySelectorAll('img')).toHaveLength(4)
  })
})
