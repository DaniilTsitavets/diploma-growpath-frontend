import { render } from '@testing-library/react'
import { ItemImage } from './ItemImage'

function sources(itemType: string) {
  const { container } = render(<ItemImage itemType={itemType} />)
  return [...container.querySelectorAll('img')].map((img) => img.getAttribute('src') ?? '')
}

describe('ItemImage', () => {
  it('shows the leaves for a pack in both themes', () => {
    const [light, dark] = sources('pack')
    expect(light).toContain('pack-light')
    expect(dark).toContain('pack-dark')
  })

  it('shows the gears for a sensor in both themes', () => {
    const [light, dark] = sources('sensor')
    expect(light).toContain('sensor-light')
    expect(dark).toContain('sensor-dark')
  })

  it('falls back to the pack picture for an unknown item type and hides it from screen readers', () => {
    const { container } = render(<ItemImage itemType="mystery" />)
    const images = [...container.querySelectorAll('img')]
    expect(images[0]?.getAttribute('src')).toContain('pack-light')
    expect(images.every((img) => img.getAttribute('alt') === '')).toBe(true)
  })
})
