const DOT_COUNT = 6

/** A stable colour slot (1 to 6) for a label, so a label keeps its colour wherever it appears. */
export function labelDot(label: string): number {
  let hash = 0
  for (const char of label.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) % 997
  return (hash % DOT_COUNT) + 1
}
