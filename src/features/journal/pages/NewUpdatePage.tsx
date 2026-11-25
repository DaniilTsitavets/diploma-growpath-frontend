import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { useEntitlement } from '@/features/entitlement/api/use-entitlement'
import { remaining, upgradeHint } from '@/features/entitlement/model/tiers'
import { isAiQuotaExhausted } from '@/features/diagnosis/model/errors'
import { useUpdates } from '../api/queries'
import { useSubmitUpdateFlow, type SubmitStep } from '../api/submit-flow'
import { formatDate, latestDateIso } from '../model/dates'
import {
  answerLabels,
  dryDepthLabels,
  isLargePot,
  lightingHint,
  lightingLabels,
  potDiameterLabels,
  potWeightLabels,
  repottedLabels,
  sensorUnitLabels,
  wateringMethodLabels,
} from '../model/labels'
import { describePhotoError } from '../model/photo-errors'
import {
  emptyUpdateValues,
  toSubmitRequest,
  updateSchema,
  type UpdateFormValues,
} from '../model/update-schema'
import { photoSlots, validatePhoto } from '../model/photo'
import type { PhotoKind } from '../model/types'
import { PhotoPicker } from '../ui/PhotoPicker'
import { ChoiceField } from '@/shared/ui/ChoiceField'
import { DatePicker } from '@/shared/ui/DatePicker'
import { TextField } from '@/shared/ui/TextField'
import styles from './NewUpdatePage.module.css'

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
  const updates = useUpdates(journalId)
  // The newest answer about watering; the form asks whether it still holds instead of starting from "today".
  const previousWateredOn =
    updates.data?.items.find((update) => update.last_watered_on !== null)?.last_watered_on ?? null
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: emptyUpdateValues as unknown as UpdateFormValues,
  })
  const [wateredSince, wateringMethod, potDiameter, sensorReading] = useWatch({
    control,
    name: ['watered_since', 'watering_method', 'pot_diameter_class', 'sensor_reading'],
  })
  const largePot = isLargePot(potDiameter)

  function choosePhoto(kind: PhotoKind, file: File | undefined) {
    setPhotos((current) => {
      const next = { ...current }
      if (file) next[kind] = file
      else delete next[kind]
      return next
    })
    setPhotoErrors((current) => ({
      ...current,
      [kind]: file ? (validatePhoto(file) ?? undefined) : undefined,
    }))
  }

  function photoProblems() {
    const problems: Partial<Record<PhotoKind, string>> = {}
    for (const slot of photoSlots) {
      const file = photos[slot.kind]
      const problem = file ? validatePhoto(file) : null
      if (problem) problems[slot.kind] = problem
    }
    return problems
  }

  const onSubmit = (values: UpdateFormValues) => {
    const problems = photoProblems()
    setPhotoErrors(problems)
    if (Object.keys(problems).length > 0) return
    submit.mutate(
      { request: toSubmitRequest(values, updateId, previousWateredOn), photos },
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
      <p className={styles.lead}>
        Only the lighting is required. For anything you are unsure of, choose "Don't know": the
        answer is simply left out. Photos are optional too, but the diagnosis needs the whole-plant
        photo; you can add it later on the update page.
      </p>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) =>
          void handleSubmit(onSubmit, () => setPhotoErrors(photoProblems()))(event)
        }
      >
        <section className={styles.section} aria-labelledby="watering-title">
          <h2 id="watering-title">Watering</h2>
          {previousWateredOn ? (
            <>
              <ChoiceField
                id="watered-since"
                label={`Did you water after ${formatDate(previousWateredOn)}?`}
                options={{ no: 'No, not since then', yes: 'Yes', unknown: "Don't know" }}
                error={errors.watered_since?.message}
                {...register('watered_since')}
              />
              {wateredSince === 'yes' && (
                <Controller
                  control={control}
                  name="last_watered_on"
                  render={({ field }) => (
                    <DatePicker
                      id="last-watered"
                      label="When did you water last?"
                      value={field.value}
                      onChange={field.onChange}
                      max={latestDateIso()}
                      clearable
                      error={errors.last_watered_on?.message}
                    />
                  )}
                />
              )}
            </>
          ) : (
            <Controller
              control={control}
              name="last_watered_on"
              render={({ field }) => (
                <DatePicker
                  id="last-watered"
                  label="Last watered"
                  hint="Leave it empty if you do not know."
                  value={field.value}
                  onChange={field.onChange}
                  max={latestDateIso()}
                  clearable
                  error={errors.last_watered_on?.message}
                />
              )}
            />
          )}
          <ChoiceField
            id="watering-method"
            label="How do you water?"
            options={wateringMethodLabels}
            error={errors.watering_method?.message}
            {...register('watering_method')}
          />
          {wateringMethod === 'partial' && (
            <p className={styles.note}>
              Watering a little at a time is not counted when the watering interval is worked out.
            </p>
          )}
        </section>

        <section className={styles.section} aria-labelledby="pot-title">
          <h2 id="pot-title">Pot and soil</h2>
          <ChoiceField
            id="pot-diameter"
            label="Pot diameter"
            options={potDiameterLabels}
            error={errors.pot_diameter_class?.message}
            {...register('pot_diameter_class')}
          />
          <ChoiceField
            id="drainage-holes"
            label="Does the pot have drainage holes?"
            options={answerLabels}
            error={errors.drainage_holes?.message}
            {...register('drainage_holes')}
          />
          <ChoiceField
            id="standing-water"
            label="Does water stand in the tray or outer pot for more than an hour?"
            options={answerLabels}
            error={errors.standing_water_over_1h?.message}
            {...register('standing_water_over_1h')}
          />
          <ChoiceField
            id="dry-depth"
            label="How far down is the soil dry?"
            hint="Push a finger into the soil to check."
            options={dryDepthLabels}
            error={errors.dry_depth?.message}
            {...register('dry_depth')}
          />
          <div className={largePot ? styles.emphasis : undefined}>
            {largePot && (
              <p className={styles.note}>
                In a large pot the weight is the most reliable sign of how dry the soil is. If you
                can, weigh it.
              </p>
            )}
            <ChoiceField
              id="pot-weight"
              label="How heavy is the pot, compared with right after watering?"
              options={potWeightLabels}
              error={errors.pot_weight_relative?.message}
              {...register('pot_weight_relative')}
            />
            <details open={largePot} key={String(largePot)} className={styles.more}>
              <summary>Weigh the pot (optional)</summary>
              <TextField
                id="weight-after"
                type="number"
                inputMode="decimal"
                step="any"
                label="Weight right after watering, g"
                error={errors.pot_weight_after_watering_g?.message}
                {...register('pot_weight_after_watering_g')}
              />
              <TextField
                id="weight-now"
                type="number"
                inputMode="decimal"
                step="any"
                label="Weight now, g"
                error={errors.pot_weight_now_g?.message}
                {...register('pot_weight_now_g')}
              />
            </details>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="light-title">
          <h2 id="light-title">Light and changes</h2>
          <ChoiceField
            id="lighting"
            label="Lighting (required)"
            hint={lightingHint}
            options={lightingLabels}
            error={errors.lighting?.message}
            {...register('lighting')}
          />
          <ChoiceField
            id="repotted"
            label="Did you repot or move the plant since the last update?"
            options={repottedLabels}
            error={errors.repotted_or_moved?.message}
            {...register('repotted_or_moved')}
          />
        </section>

        <details className={styles.section}>
          <summary>Sensors (optional)</summary>
          <div className={styles.sensors}>
            <TextField
              id="sensor"
              type="number"
              inputMode="decimal"
              step="any"
              label="Soil sensor reading"
              min={0}
              error={errors.sensor_reading?.message}
              {...register('sensor_reading')}
            />
            {sensorReading.trim() !== '' && (
              <ChoiceField
                id="sensor-unit"
                label="Unit of the reading"
                options={sensorUnitLabels}
                error={errors.sensor_unit?.message}
                {...register('sensor_unit')}
              />
            )}
            <TextField
              id="air-temp"
              type="number"
              inputMode="decimal"
              step="any"
              label="Air temperature now, °C"
              error={errors.air_temp_c?.message}
              {...register('air_temp_c')}
            />
            <TextField
              id="air-rh"
              type="number"
              inputMode="decimal"
              step="any"
              label="Air humidity now, %"
              error={errors.air_rh_pct?.message}
              {...register('air_rh_pct')}
            />
            <TextField
              id="air-temp-min"
              type="number"
              inputMode="decimal"
              step="any"
              label="Lowest temperature since the last update, °C"
              error={errors.air_temp_min_c?.message}
              {...register('air_temp_min_c')}
            />
            <TextField
              id="air-temp-max"
              type="number"
              inputMode="decimal"
              step="any"
              label="Highest temperature since the last update, °C"
              error={errors.air_temp_max_c?.message}
              {...register('air_temp_max_c')}
            />
            <TextField
              id="air-rh-min"
              type="number"
              inputMode="decimal"
              step="any"
              label="Lowest humidity since the last update, %"
              error={errors.air_rh_min_pct?.message}
              {...register('air_rh_min_pct')}
            />
            <TextField
              id="air-rh-max"
              type="number"
              inputMode="decimal"
              step="any"
              label="Highest humidity since the last update, %"
              error={errors.air_rh_max_pct?.message}
              {...register('air_rh_max_pct')}
            />
          </div>
        </details>

        <fieldset className={styles.photos}>
          <legend>Photos</legend>
          {photoSlots.map((slot) => (
            <PhotoPicker
              key={slot.kind}
              slot={slot}
              required={false}
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
                : (describePhotoError(submit.error) ?? describeError(submit.error))}
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
