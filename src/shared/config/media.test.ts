import { creditsUrl, itemImageUrl, normaliseMediaBaseUrl } from './media'

describe('media addresses', () => {
  it('builds the picture address from the slug', () => {
    expect(itemImageUrl('http://localhost:4566/growpath-media', 'aloe-vera')).toBe(
      'http://localhost:4566/growpath-media/aloe-vera.webp',
    )
    expect(creditsUrl('http://x/m')).toBe('http://x/m/credits.json')
  })

  it('drops a trailing slash and treats an empty value as not configured', () => {
    expect(normaliseMediaBaseUrl('http://x/m/')).toBe('http://x/m')
    expect(normaliseMediaBaseUrl('')).toBeNull()
    expect(normaliseMediaBaseUrl(undefined)).toBeNull()
  })
})
