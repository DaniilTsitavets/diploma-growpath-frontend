import { Link, useParams } from 'react-router'
import { DiagnosisPanel } from '@/features/diagnosis/ui/DiagnosisPanel'
import { QuotaSummary } from '@/features/entitlement/ui/QuotaSummary'
import { useEntitlement } from '@/features/entitlement/api/use-entitlement'
import { EscalationPanel } from '@/features/escalation/ui/EscalationPanel'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import { usePhotos, useUpdates } from '../api/queries'
import { formatDate, formatDateTime } from '../model/dates'
import { drainageLabels, fingerTestLabels, lightingLabels, potWeightLabels } from '../model/labels'
import { photoSlots, rootsSlot } from '../model/photo'
import type { PlantUpdate } from '../model/types'
import { PhotoSlot } from '../ui/PhotoSlot'
import styles from './UpdatePage.module.css'

function Answers({ update }: { update: PlantUpdate }) {
  return (
    <dl className={styles.summary}>
      <dt>Last watered</dt>
      <dd>{update.last_watered_on ? formatDate(update.last_watered_on) : 'Not given'}</dd>
      <dt>Watering interval</dt>
      <dd>
        {update.watering_interval_days ? `${update.watering_interval_days} days` : 'Not given'}
      </dd>
      <dt>Drainage</dt>
      <dd>{drainageLabels[update.drainage]}</dd>
      <dt>Lighting</dt>
      <dd>{lightingLabels[update.lighting]}</dd>
      <dt>Soil by finger test</dt>
      <dd>{fingerTestLabels[update.finger_test]}</dd>
      <dt>Pot weight</dt>
      <dd>{potWeightLabels[update.pot_weight]}</dd>
      <dt>Sensor reading</dt>
      <dd>{update.sensor_reading ?? 'Not given'}</dd>
    </dl>
  )
}

function Photos({ update }: { update: PlantUpdate }) {
  const photos = usePhotos(update.id)
  const slots = update.diagnosis?.roots_photo_requested ? [...photoSlots, rootsSlot] : photoSlots
  const urlByKind = new Map(photos.data?.photos.map((photo) => [photo.kind, photo.url]))
  const missing = photos.data?.missing_required ?? []

  return (
    <>
      {photos.error && (
        <div role="alert">
          <p className={styles.error}>{describeError(photos.error)}</p>
          <Button onClick={() => void photos.refetch()}>Try again</Button>
        </div>
      )}
      {photos.data && (
        <p role="status">
          {missing.length === 0
            ? 'Both required photos are uploaded.'
            : `Still needed: ${missing
                .map((kind) => photoSlots.find((slot) => slot.kind === kind)?.label ?? kind)
                .join(', ')}.`}
        </p>
      )}
      <ul className={styles.slots}>
        {slots.map((slot) => (
          <PhotoSlot
            key={slot.kind}
            updateId={update.id}
            slot={slot}
            uploadedUrl={urlByKind.get(slot.kind)}
          />
        ))}
      </ul>
    </>
  )
}

export function UpdatePage() {
  const { journalId = '', updateId = '' } = useParams()
  const updates = useUpdates(journalId)
  const update = updates.data?.items.find((item) => item.id === updateId)
  const entitlement = useEntitlement()

  return (
    <>
      <p>
        <Link to={`/journals/${journalId}`}>Back to the journal</Link>
      </p>
      <h1>Update</h1>
      {updates.isPending && (
        <div aria-busy="true">
          <p className="visually-hidden" role="status">
            Loading the update
          </p>
          <Skeleton height="panel" />
        </div>
      )}
      {updates.error && (
        <div role="alert">
          <p className={styles.error}>{describeError(updates.error)}</p>
          <Button onClick={() => void updates.refetch()}>Try again</Button>
        </div>
      )}
      {updates.data && !update && <p role="alert">We could not find this update.</p>}
      {update && (
        <>
          <p>Created {formatDateTime(update.created_at)}</p>
          <section className={styles.section} aria-labelledby="answers-title">
            <h2 id="answers-title">Your answers</h2>
            <Answers update={update} />
          </section>
          <section className={styles.section} aria-labelledby="photos-title">
            <h2 id="photos-title">Photos</h2>
            <Photos update={update} />
          </section>
          {entitlement.data && <QuotaSummary entitlement={entitlement.data} />}
          <section className={styles.section} aria-labelledby="diagnosis-title">
            <h2 id="diagnosis-title">Diagnosis</h2>
            <DiagnosisPanel updateId={update.id} journalId={journalId} />
          </section>
          <section className={styles.section} aria-labelledby="expert-title">
            <h2 id="expert-title">Expert help</h2>
            <EscalationPanel updateId={update.id} journalId={journalId} />
          </section>
        </>
      )}
    </>
  )
}
