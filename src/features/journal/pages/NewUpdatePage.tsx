import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { useEntitlement } from '@/features/entitlement/api/use-entitlement'
import { remaining, upgradeHint } from '@/features/entitlement/model/tiers'
import { isAiQuotaExhausted } from '@/features/diagnosis/model/errors'
import { useSubmitUpdateFlow, type SubmitStep } from '../api/submit-flow'
import { todayIso } from '../model/dates'
import { drainageLabels, fingerTestLabels, lightingLabels, potWeightLabels } from '../model/labels'
import {
  emptyUpdateValues,
  toSubmitRequest,
  updateSchema,
  type UpdateFormValues,
} from '../model/update-schema'
import { photoSlots, validatePhoto } from '../model/photo'
import type { PhotoKind } from '../model/types'
import { PhotoPicker } from '../ui/PhotoPicker'
import { SelectField } from '@/shared/ui/SelectField'
import { TextField } from '@/shared/ui/TextField'
import styles from './NewUpdatePage.module.css'

const REQUIRED: PhotoKind[] = ['overview', 'soil']

const stepText: Record<SubmitStep, string> = {
  idle: 'Submit update',
  saving: 'Saving your answers…',
  photos: 'Uploading photos…',
  diagnosing: 'Checking your plant…',
}

export function NewUpdatePage() {
  const { journalId = '' } = useParams()
  const navigate = useNavigate()
  const submit = useSubmitUpdateFlow(journalId)
  const entitlement = useEntitlement()
  const [photos, setPhotos] = useState<Partial<Record<PhotoKind, File>>>({})
  const [photoErrors, setPhotoErrors] = useState<Partial<Record<PhotoKind, string>>>({})
  // One id per form, so a retried submit returns the stored update instead of creating a second one.
  const [updateId] = useState(() => crypto.randomUUID())
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: emptyUpdateValues as UpdateFormValues,
  })

  function choosePhoto(kind: PhotoKind, file: File | undefined) {
    setPhotos((current) => ({ ...current, [kind]: file }))
    setPhotoErrors((current) => ({
      ...current,
      [kind]: file ? (validatePhoto(file) ?? undefined) : undefined,
    }))
  }

  function photoProblems() {
    const problems: Partial<Record<PhotoKind, string>> = {}
    for (const slot of photoSlots) {
      const file = photos[slot.kind]
      if (file) {
        const problem = validatePhoto(file)
        if (problem) problems[slot.kind] = problem
      } else if (REQUIRED.includes(slot.kind)) {
        problems[slot.kind] = 'Add this photo to continue.'
      }
    }
    return problems
  }

  const onSubmit = (values: UpdateFormValues) => {
    const problems = photoProblems()
    setPhotoErrors(problems)
    if (Object.keys(problems).length > 0) return
    submit.mutate(
      { request: toSubmitRequest(values, updateId), photos },
      { onSuccess: (update) => void navigate(`/journals/${journalId}/updates/${update.id}`) },
    )
  }

  const quotaExhausted = isAiQuotaExhausted(submit.error)
  const aiQuota = entitlement.data?.ai_quota_today

  return (
    <>
      <p>
        <Link to={`/journals/${journalId}`}>Back to the journal</Link>
      </p>
      <h1>New update</h1>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      >
        <TextField
          id="last-watered"
          type="date"
          label="Last watered"
          hint="Optional."
          max={todayIso()}
          error={errors.last_watered_on?.message}
          {...register('last_watered_on')}
        />
        <TextField
          id="interval"
          type="number"
          inputMode="numeric"
          label="Watering interval, days"
          hint="Optional, 1 to 365."
          min={1}
          max={365}
          error={errors.watering_interval_days?.message}
          {...register('watering_interval_days')}
        />
        <SelectField
          id="drainage"
          label="Drainage"
          options={drainageLabels}
          error={errors.drainage?.message}
          {...register('drainage')}
        />
        <SelectField
          id="lighting"
          label="Lighting"
          options={lightingLabels}
          error={errors.lighting?.message}
          {...register('lighting')}
        />
        <SelectField
          id="finger-test"
          label="Soil by finger test"
          options={fingerTestLabels}
          error={errors.finger_test?.message}
          {...register('finger_test')}
        />
        <SelectField
          id="pot-weight"
          label="Pot weight"
          options={potWeightLabels}
          error={errors.pot_weight?.message}
          {...register('pot_weight')}
        />
        <TextField
          id="sensor"
          type="number"
          inputMode="decimal"
          step="any"
          label="Sensor reading"
          hint="Optional, from your soil sensor."
          min={0}
          error={errors.sensor_reading?.message}
          {...register('sensor_reading')}
        />
        <fieldset className={styles.photos}>
          <legend>Photos</legend>
          {photoSlots.map((slot) => (
            <PhotoPicker
              key={slot.kind}
              slot={slot}
              required={REQUIRED.includes(slot.kind)}
              file={photos[slot.kind]}
              error={photoErrors[slot.kind]}
              onChange={(file) => choosePhoto(slot.kind, file)}
            />
          ))}
        </fieldset>
        {aiQuota && (
          <p className={styles.quota}>
            Submitting uses one AI check. Left today: {remaining(aiQuota)} of {aiQuota.limit}.
          </p>
        )}
        {submit.error && (
          <div role="alert" className={styles.error}>
            <p>
              {quotaExhausted
                ? 'Your AI checks for today are used up, so this update was not created.'
                : describeError(submit.error)}
            </p>
            {quotaExhausted && entitlement.data && upgradeHint(entitlement.data.tier) && (
              <p>{upgradeHint(entitlement.data.tier)}</p>
            )}
          </div>
        )}
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending ? stepText[submit.step] : submit.isError ? 'Try again' : stepText.idle}
        </Button>
      </form>
    </>
  )
}
