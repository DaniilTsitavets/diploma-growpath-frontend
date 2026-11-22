export type ImagePriority = 'high' | 'normal' | 'lazy'

/** The first card gets high priority, the rest of the first row load normally, the others wait until scrolled to. */
export function priorityForIndex(index: number): ImagePriority {
  if (index === 0) return 'high'
  return index < 4 ? 'normal' : 'lazy'
}
