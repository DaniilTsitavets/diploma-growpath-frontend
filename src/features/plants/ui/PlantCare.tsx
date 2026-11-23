import { ApiError } from '@/shared/api/api-error'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import { usePlant } from '../api/use-plant'
import { careBlocks, keyTakeaways, quickAnswer, quickFacts } from '../model/care-blocks'
import type { Plant } from '../model/types'
import styles from './PlantCare.module.css'

/** Links come from the backend, so only web addresses are turned into links. */
function safeHref(address: string): string | null {
  try {
    const url = new URL(address)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

function Attribution({ plant }: { plant: Plant }) {
  const source = plant.sources[0]
  if (!source) return null
  const href = safeHref(source.url)
  return (
    <p className={styles.attribution}>
      Care data:{' '}
      {href ? (
        <a href={href} rel="noreferrer">
          {source.name}
        </a>
      ) : (
        source.name
      )}{' '}
      · {source.license}
    </p>
  )
}

function CareContent({ plant }: { plant: Plant }) {
  const answer = quickAnswer(plant)
  const facts = quickFacts(plant)
  const takeaways = keyTakeaways(plant)
  const blocks = careBlocks(plant)

  return (
    <div className={styles.care}>
      {answer && <p className={styles.quick}>{answer}</p>}
      <dl className={styles.facts} aria-label="Quick facts">
        {facts.map((fact) => (
          <div key={fact.label} className={styles.fact}>
            <dt>{fact.label}</dt>
            <dd className={fact.value === null ? styles.missing : undefined}>
              {fact.value ?? 'Not specified'}
            </dd>
          </div>
        ))}
      </dl>
      {takeaways.length > 0 && (
        <section aria-labelledby="takeaways-title">
          <h2 id="takeaways-title">Key takeaways</h2>
          <ul className={styles.takeaways}>
            {takeaways.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="care-title">
        <h2 id="care-title">Care</h2>
        {blocks.every((block) => block.paragraphs.length === 0) ? (
          <p className={styles.missing}>
            A detailed care guide is not available for this plant yet.
          </p>
        ) : (
          <div className={styles.blocks}>
            {blocks.map((block) => (
              <article key={block.id} className={styles.block}>
                <h3>{block.title}</h3>
                {block.paragraphs.length === 0 ? (
                  <p className={styles.missing}>Not specified</p>
                ) : (
                  block.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                )}
              </article>
            ))}
          </div>
        )}
      </section>
      <Attribution plant={plant} />
    </div>
  )
}

/** Independent of the item request: if care information fails, the item and its order button stay usable. */
export function PlantCare({ plantSlug }: { plantSlug: string }) {
  const plant = usePlant(plantSlug)

  if (plant.isPending) {
    return (
      <div aria-busy="true">
        <p className="visually-hidden" role="status">
          Loading care information
        </p>
        <Skeleton height="block" />
        <Skeleton height="block" width={70} />
      </div>
    )
  }

  if (plant.error) {
    const missing = plant.error instanceof ApiError && plant.error.kind === 'not-found'
    return (
      <div className={styles.unavailable} role={missing ? 'status' : 'alert'}>
        <p>
          {missing
            ? 'There is no care information for this plant yet.'
            : 'Care information is unavailable right now.'}
        </p>
        {!missing && (
          <Button
            variant="secondary"
            onClick={() => void plant.refetch()}
            disabled={plant.isFetching}
          >
            Try again
          </Button>
        )}
      </div>
    )
  }

  return <CareContent plant={plant.data} />
}
