import { render } from '@testing-library/react'
import { useTheme } from '@/shared/theme/theme-store'
import { ItemImage } from './ItemImage'

afterEach(() => useTheme.setState({ theme: 'light' }))

function image(itemType: string, priority?: 'high' | 'normal' | 'lazy') {
  const { container } = render(<ItemImage itemType={itemType} priority={priority} />)
  return container.querySelector('img') as HTMLImageElement
}

describe('ItemImage', () => {
  it('shows the leaves for a pack and the gears for a sensor', () => {
    expect(image('pack').getAttribute('src')).toContain('pack-light')
    expect(image('sensor').getAttribute('src')).toContain('sensor-light')
  })

  it('loads only the picture of the active theme', () => {
    useTheme.setState({ theme: 'dark' })
    const { container } = render(<ItemImage itemType="pack" />)

    expect(container.querySelectorAll('img')).toHaveLength(1)
    expect(container.querySelector('img')?.getAttribute('src')).toContain('pack-dark')
  })

  it('falls back to the pack picture and hides it from screen readers', () => {
    const img = image('mystery')
    expect(img.getAttribute('src')).toContain('pack-light')
    expect(img.getAttribute('alt')).toBe('')
  })

  it('reserves its size, so the card does not jump when it loads', () => {
    const img = image('pack')
    expect(img).toHaveAttribute('width', '512')
    expect(img).toHaveAttribute('height', '384')
  })

  it('applies the priority it is given', () => {
    expect(image('pack', 'high')).toHaveAttribute('fetchpriority', 'high')
    expect(image('pack', 'high')).not.toHaveAttribute('loading')
    expect(image('pack', 'normal')).not.toHaveAttribute('loading')
    expect(image('pack', 'lazy')).toHaveAttribute('loading', 'lazy')
  })
})
