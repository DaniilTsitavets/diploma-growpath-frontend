/** has_dominant_candidate is null while there is no result to judge. */
export function dominanceNote(hasDominantCandidate: boolean | null | undefined): string | null {
  if (hasDominantCandidate === true) return 'There is a clear main cause.'
  if (hasDominantCandidate === false) return 'The cause is ambiguous.'
  return null
}
