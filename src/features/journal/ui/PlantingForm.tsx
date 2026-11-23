import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/shared/ui/Button'
import { useRecordPlanting } from '../api/queries'
import { formatDate, todayIso } from '../model/dates'
import { describePlantingError } from '../model/planting-errors'
import { plantingSchema, type PlantingValues } from '../model/planting-schema'
import styles from './PlantingForm.module.css'

interface PlantingFormProps {
  journalId: string
  plantedOn: string | null
}

export function PlantingForm({ journalId, plantedOn }: PlantingFormProps) {
  const planting = useRecordPlanting(journalId)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlantingValues>({
    resolver: zodResolver(plantingSchema),
    defaultValues: { planted_on: plantedOn ?? '' },
  })

  // The backend keeps the first recorded date and refuses another one, so a saved date is shown and not edited.
  if (plantedOn) {
    return (
      <p className={styles.saved}>
        Planted on <strong>{formatDate(plantedOn)}</strong>. The planting date is saved and cannot
        be changed.
      </p>
    )
  }

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => void handleSubmit((values) => planting.mutate(values.planted_on))(event)}
    >
      <div className={styles.field}>
        <label htmlFor="planted-on">Planting date</label>
        <input
          id="planted-on"
          type="date"
          max={todayIso()}
          className={styles.input}
          aria-invalid={errors.planted_on ? 'true' : undefined}
          aria-describedby={errors.planted_on ? 'planted-on-error' : undefined}
          {...register('planted_on')}
        />
        {errors.planted_on && (
          <p id="planted-on-error" className={styles.error}>
            {errors.planted_on.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={planting.isPending}>
        Record planting
      </Button>
      {planting.error && (
        <p role="alert" className={styles.error}>
          {describePlantingError(planting.error)}
        </p>
      )}
    </form>
  )
}
