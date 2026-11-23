import { FileDropzone } from '@/shared/ui/FileDropzone'
import { ACCEPTED_PHOTO_TYPES, PHOTO_NOTE, type PhotoSlot } from '../model/photo'
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
      <FileDropzone
        id={id}
        accept={ACCEPTED_PHOTO_TYPES}
        note={PHOTO_NOTE}
        describedBy={`${id}-hint`}
        file={file}
        onFile={onChange}
      />
      <p id={`${id}-hint`} className={styles.hint}>
        {slot.hint}
      </p>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
