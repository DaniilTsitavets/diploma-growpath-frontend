import { Skeleton } from '@/shared/ui/Skeleton'
import { mediaBaseUrl } from '@/shared/config/media'
import { useMediaCredits } from '../api/use-media-credits'
import { photoCaption } from '../model/caption'
import styles from './CreditsPage.module.css'

const CC_BY_URL = 'https://creativecommons.org/licenses/by/4.0/'

export function CreditsPage() {
  const credits = useMediaCredits()

  return (
    <>
      <p className="eyebrow">Thanks and licences</p>
      <h1>Credits</h1>

      <h2>Care information</h2>
      <p>
        Plant care data comes from{' '}
        <a href="https://www.plantsolve.com/" rel="noreferrer">
          PlantSolve
        </a>
        , licensed under{' '}
        <a href={CC_BY_URL} rel="noreferrer">
          CC BY 4.0
        </a>
        . Every plant page links to its record there.
      </p>

      <h2>Photos</h2>
      <Photos configured={mediaBaseUrl() !== null} state={credits} />
    </>
  )
}

function Photos({
  configured,
  state,
}: {
  configured: boolean
  state: ReturnType<typeof useMediaCredits>
}) {
  if (!configured) return <p>No photos are published yet.</p>
  if (state.isPending) return <Skeleton width={60} height="row" />
  if (state.isError)
    return <p role="alert">The list of photos could not be loaded. Try again later.</p>
  if (state.data.length === 0) return <p>No photos are published yet.</p>

  return (
    <ul className={styles.list}>
      {state.data.map((credit) => {
        const caption = photoCaption(credit)
        return (
          <li key={credit.slug} className={styles.entry}>
            <strong>{credit.slug}</strong>
            <span className={styles.meta}>
              {caption.href ? (
                <a href={caption.href} rel="noreferrer">
                  {caption.text}
                </a>
              ) : (
                caption.text
              )}{' '}
              · {credit.license}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
