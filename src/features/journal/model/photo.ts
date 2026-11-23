import type { PhotoKind } from './types'

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const PHOTO_NOTE = 'JPEG, PNG or WebP, up to 10 MB'

export interface PhotoSlot {
  kind: PhotoKind
  label: string
  hint: string
}

export const photoSlots: PhotoSlot[] = [
  {
    kind: 'overview',
    label: 'Whole plant',
    hint: 'The whole plant in its pot. The diagnosis needs it.',
  },
  {
    kind: 'symptom_closeup',
    label: 'Symptom close-up',
    hint: 'A close photo of the problem, optional.',
  },
]

export const rootsSlot: PhotoSlot = {
  kind: 'roots_drainage',
  label: 'Roots and drainage',
  hint: 'Requested only when the diagnosis asks for it.',
}

export function validatePhoto(file: File): string | null {
  if (!(ACCEPTED_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return 'Use a JPEG, PNG or WebP photo.'
  }
  if (file.size === 0) return 'The file is empty.'
  if (file.size > MAX_PHOTO_BYTES) return 'The photo is larger than 10 MB.'
  return null
}
