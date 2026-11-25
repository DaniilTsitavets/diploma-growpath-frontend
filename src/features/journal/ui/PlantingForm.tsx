import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/shared/ui/Button'
import { DatePicker } from '@/shared/ui/DatePicker'
import { useRecordPlanting } from '../api/queries'
import { formatDate, latestDateIso } from '../model/dates'
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
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PlantingValues>({
    resolver: zodResolver(plantingSchema),
    defaultValues: { planted_on: plantedOn ?? latestDateIso() },
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
      <Controller
        control={control}
        name="planted_on"
        render={({ field }) => (
          <DatePicker
            id="planted-on"
            label="Planting date"
            value={field.value}
            onChange={field.onChange}
            max={latestDateIso()}
            error={errors.planted_on?.message}
          />
        )}
      />
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
