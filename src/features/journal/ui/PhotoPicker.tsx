import { ACCEPTED_PHOTO_TYPES, type PhotoSlot } from '../model/photo'
import styles from './PhotoPicker.module.css'

interface PhotoPickerProps {
  slot: PhotoSlot
  required: boolean
  file: File | undefined
  error?: string
  onChange: (file: File | undefined) => void
}

/** Only chooses a file; uploading happens when the whole update is submitted. */
export function PhotoPicker({ slot, required, file, error, onChange }: PhotoPickerProps) {
  const id = `new-photo-${slot.kind}`
  return (
    <div className={styles.picker}>
      <label htmlFor={id}>
        {slot.label}
        {required ? ' (required)' : ' (optional)'}
      </label>
      <input
        id={id}
        type="file"
        accept={ACCEPTED_PHOTO_TYPES.join(',')}
        aria-describedby={`${id}-hint`}
        aria-invalid={error ? 'true' : undefined}
        onChange={(event) => onChange(event.target.files?.[0])}
      />
      <p id={`${id}-hint`} className={styles.hint}>
        {file ? `Selected: ${file.name}` : slot.hint}
      </p>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
