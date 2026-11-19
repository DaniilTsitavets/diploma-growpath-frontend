import { MAX_PHOTO_BYTES, validatePhoto } from './photo'

const file = (type: string, size: number) => new File([new Uint8Array(size)], 'p', { type })

describe('validatePhoto', () => {
  it('accepts a small JPEG', () => {
    expect(validatePhoto(file('image/jpeg', 100))).toBeNull()
  })

  it('rejects other file types', () => {
    expect(validatePhoto(file('application/pdf', 100))).toMatch(/JPEG, PNG or WebP/)
  })

  it('rejects empty and oversized files', () => {
    expect(validatePhoto(file('image/png', 0))).toMatch(/empty/)
    expect(validatePhoto(file('image/png', MAX_PHOTO_BYTES + 1))).toMatch(/10 MB/)
  })
})
