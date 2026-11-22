import type { MediaCredit } from './types'

export interface PhotoCaption {
  text: string
  href: string | null
}

/** "Photo by <author> on Pixabay", "Image by rawpixel.com on Magnific": the wording each licence asks for. */
export function photoCaption(credit: MediaCredit): PhotoCaption {
  const host = hostOf(credit.source)
  const href = host ? credit.source : null

  if (host === 'pixabay.com') return { text: `Photo by ${credit.author} on Pixabay`, href }
  if (host === 'magnific.com' || host === 'freepik.com') {
    return { text: `Image by ${credit.author} on Magnific`, href }
  }
  return { text: host ? `Photo by ${credit.author} on ${host}` : `Photo by ${credit.author}`, href }
}

function hostOf(address: string): string {
  try {
    return new URL(address).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
