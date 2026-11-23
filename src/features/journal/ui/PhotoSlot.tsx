import { useState } from 'react'
import { describeError } from '@/shared/api/messages'
import { FileDropzone } from '@/shared/ui/FileDropzone'
import { useUploadPhoto } from '../api/queries'
import {
  ACCEPTED_PHOTO_TYPES,
  PHOTO_NOTE,
  validatePhoto,
  type PhotoSlot as Slot,
} from '../model/photo'
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
      <FileDropzone
        id={inputId}
        accept={ACCEPTED_PHOTO_TYPES}
        note={PHOTO_NOTE}
        describedBy={hintId}
        disabled={upload.isPending}
        imageUrl={uploadedUrl}
        imageAlt={`${slot.label} photo`}
        onFile={onSelect}
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
