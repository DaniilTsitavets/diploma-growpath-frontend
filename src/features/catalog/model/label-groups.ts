export interface LabelGroup {
  id: string
  title: string
  hint: string
  labels: string[]
}

interface GroupDefinition {
  id: string
  title: string
  /** `any`: an item has one value of the group, so one ticked label is enough. `all`: it must carry every ticked one. */
  match: 'any' | 'all'
  labels: readonly string[]
}

/** The known need labels by topic. A label no group knows about, and a group with fewer than two labels, go to "Other". */
const DEFINITIONS: readonly GroupDefinition[] = [
  {
    id: 'light',
    title: 'Light',
    match: 'any',
    labels: ['low-light', 'bright-light', 'direct-sun'],
  },
  {
    id: 'difficulty',
    title: 'Difficulty',
    match: 'any',
    labels: ['beginner', 'intermediate', 'advanced'],
  },
  {
    id: 'watering',
    title: 'Watering',
    match: 'all',
    labels: ['drought-tolerant', 'likes-moisture', 'humidity-lover'],
  },
  { id: 'pets', title: 'Pets', match: 'any', labels: ['pet-safe', 'toxic-to-pets'] },
  { id: 'size', title: 'Size and habit', match: 'any', labels: ['compact', 'large', 'hanging'] },
  { id: 'kind', title: 'Plant type', match: 'all', labels: ['herb', 'succulent', 'edible'] },
  {
    id: 'features',
    title: 'Features',
    match: 'all',
    labels: [
      'flowering',
      'fragrant',
      'pollinator-friendly',
      'air-purifying',
      'rare',
      'low-maintenance',
    ],
  },
]

const OTHER_TITLE = 'Other'

function present(definition: GroupDefinition, labels: ReadonlySet<string>): string[] {
  return definition.labels.filter((label) => labels.has(label))
}

const hasChoice = (levels: string[]) => levels.length >= 2

export function groupLabels(labels: string[]): LabelGroup[] {
  const available = new Set(labels)
  const groups: LabelGroup[] = []
  const placed = new Set<string>()

  for (const definition of DEFINITIONS) {
    const inGroup = present(definition, available)
    if (!hasChoice(inGroup)) continue
    inGroup.forEach((label) => placed.add(label))
    groups.push({
      id: definition.id,
      title: definition.title,
      hint:
        definition.match === 'any'
          ? 'Shows items that have any ticked option.'
          : 'Shows items that have every ticked option.',
      labels: inGroup,
    })
  }

  const other = labels.filter((label) => !placed.has(label))
  if (other.length > 0) {
    groups.push({
      id: 'other',
      title: OTHER_TITLE,
      hint: 'Shows items that have every ticked option.',
      labels: other,
    })
  }
  return groups
}

/**
 * Within a group of alternatives (light, difficulty, pets, size) any ticked label is enough, within the
 * rest every ticked label must be on the item, and the groups are combined with "and". A label that
 * falls into "Other" because its group is small behaves the same either way: a single label has no choice.
 */
export function matchesLabels(itemLabels: string[], ticked: string[]): boolean {
  const has = (label: string) => itemLabels.includes(label)
  const known = new Set<string>()

  for (const definition of DEFINITIONS) {
    const chosen = ticked.filter((label) => definition.labels.includes(label))
    chosen.forEach((label) => known.add(label))
    const ok =
      definition.match === 'any' ? chosen.length === 0 || chosen.some(has) : chosen.every(has)
    if (!ok) return false
  }
  return ticked.filter((label) => !known.has(label)).every(has)
}
