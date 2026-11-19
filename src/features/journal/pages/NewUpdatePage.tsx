import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { useSubmitUpdate } from '../api/queries'
import { todayIso } from '../model/dates'
import { drainageLabels, fingerTestLabels, lightingLabels, potWeightLabels } from '../model/labels'
import {
  emptyUpdateValues,
  toSubmitRequest,
  updateSchema,
  type UpdateFormValues,
} from '../model/update-schema'
import { SelectField } from '../ui/SelectField'
import { TextField } from '../ui/TextField'
import styles from './NewUpdatePage.module.css'

export function NewUpdatePage() {
  const { journalId = '' } = useParams()
  const navigate = useNavigate()
  const submit = useSubmitUpdate(journalId)
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

  const onSubmit = (values: UpdateFormValues) =>
    submit.mutate(toSubmitRequest(values, updateId), {
      onSuccess: (update) => void navigate(`/journals/${journalId}/updates/${update.id}`),
    })

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
        {submit.error && (
          <p role="alert" className={styles.error}>
            {describeError(submit.error)}
          </p>
        )}
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending ? 'Saving…' : 'Save and add photos'}
        </Button>
      </form>
    </>
  )
}
