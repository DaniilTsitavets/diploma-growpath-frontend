import { useEffect, useRef, useState, type DragEvent } from 'react'
import { formatFileSize } from '../lib/file-size'
import { Icon } from './Icon'
import styles from './FileDropzone.module.css'

interface FileDropzoneProps {
  /** The id of the file input; a label elsewhere points at it, so the zone is named by that label. */
  id: string
  accept: readonly string[]
  /** Said under the prompt, for example the types and the largest size. */
  note: string
  describedBy?: string
  disabled?: boolean
  /** The chosen file: shown as a small picture with its name and size, and it can be removed. */
  file?: File
  /** A picture that is already there (an uploaded photo), shown until a new file is chosen. */
  imageUrl?: string
  /** What the existing picture shows; the preview of a chosen file is decorative, its name is printed beside it. */
  imageAlt?: string
  onFile: (file: File | undefined) => void
}

/**
 * A place to drop a file or to browse for one. It stays a real file input underneath (reachable by keyboard and
 * announced by its label), and the dashed area is the large target for the mouse and for dragging.
 */
export function FileDropzone({
  id,
  accept,
  note,
  describedBy,
  disabled = false,
  file,
  imageUrl,
  imageAlt = '',
  onFile,
}: FileDropzoneProps) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  // The picture of a chosen file lives at a temporary address that is released when the file changes or the zone goes.
  const [localUrl, setLocalUrl] = useState<string>()
  const created = useRef<string | undefined>(undefined)
  const preview = (file && localUrl) || imageUrl

  useEffect(
    () => () => {
      if (created.current) URL.revokeObjectURL(created.current)
    },
    [],
  )

  function choose(next: File | undefined) {
    if (created.current) URL.revokeObjectURL(created.current)
    created.current =
      next && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(next) : undefined
    setLocalUrl(created.current)
    onFile(next)
  }

  function drop(event: DragEvent) {
    event.preventDefault()
    setOver(false)
    if (!disabled) choose(event.dataTransfer.files[0])
  }

  function remove() {
    if (input.current) input.current.value = ''
    choose(undefined)
  }

  return (
    <div
      className={styles.zone}
      data-over={over}
      data-disabled={disabled}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('button')) return
        if (!disabled) input.current?.click()
      }}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
    >
      <input
        ref={input}
        id={id}
        type="file"
        className={`visually-hidden ${styles.input}`}
        accept={accept.join(',')}
        aria-describedby={describedBy}
        disabled={disabled}
        onChange={(event) => {
          choose(event.target.files?.[0])
          // Cleared so that the same file can be chosen again; the file itself is already held by the page.
          event.target.value = ''
        }}
      />
      {preview ? (
        <img className={styles.thumb} src={preview} alt={file ? '' : imageAlt} />
      ) : (
        <span className={styles.icon}>
          <Icon name="image" size={28} />
        </span>
      )}
      {file ? (
        <p className={styles.prompt}>
          {file.name} · {formatFileSize(file.size)}
        </p>
      ) : (
        <p className={styles.prompt}>
          {imageUrl ? 'Drop a new photo here, or ' : 'Drop your photo here, or '}
          <span className={styles.browse}>browse</span>
        </p>
      )}
      <p className={styles.note}>{note}</p>
      {file && (
        <button type="button" className={styles.remove} onClick={remove}>
          Remove
        </button>
      )}
    </div>
  )
}
