import { useState } from 'react'
import { describeError } from '@/shared/api/messages'
import { useUploadPhoto } from '../api/queries'
import { ACCEPTED_PHOTO_TYPES, validatePhoto, type PhotoSlot as Slot } from '../model/photo'
import styles from './PhotoSlot.module.css'

interface PhotoSlotProps {
  updateId: string
  slot: Slot
  uploadedUrl?: string
}

export function PhotoSlot({ updateId, slot, uploadedUrl }: PhotoSlotProps) {
  const upload = useUploadPhoto(updateId)
  const [fileError, setFileError] = useState<string | null>(null)
  const inputId = `photo-${slot.kind}`
  const hintId = `${inputId}-hint`

  function onSelect(file: File | undefined) {
    if (!file) return
    const problem = validatePhoto(file)
    setFileError(problem)
    if (!problem) upload.mutate({ kind: slot.kind, file })
  }

  return (
    <li className={styles.slot}>
      <h3>
        <label htmlFor={inputId}>{slot.label}</label>
      </h3>
      <p id={hintId} className={styles.hint}>
        {slot.hint}
      </p>
      {uploadedUrl && (
        <img className={styles.preview} src={uploadedUrl} alt={`${slot.label} photo`} />
      )}
      <input
        id={inputId}
        type="file"
        accept={ACCEPTED_PHOTO_TYPES.join(',')}
        aria-describedby={hintId}
        disabled={upload.isPending}
        onChange={(event) => {
          onSelect(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      {upload.isPending && (
        <p role="status" className={styles.status}>
          Uploading…
        </p>
      )}
      {upload.isSuccess && !upload.isPending && (
        <p role="status" className={styles.status}>
          Uploaded.
        </p>
      )}
      {(fileError ?? upload.error) && (
        <p role="alert" className={styles.error}>
          {fileError ?? describeError(upload.error)}
        </p>
      )}
    </li>
  )
}
