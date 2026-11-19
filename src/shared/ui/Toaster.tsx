import { useEffect } from 'react'
import { useToasts, type Toast } from './toast-store'
import styles from './Toaster.module.css'

const LIFETIME_MS = 8000

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToasts((state) => state.dismiss)
  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), LIFETIME_MS)
    return () => clearTimeout(timer)
  }, [dismiss, toast.id])

  return (
    <div className={`${styles.toast} ${toast.tone === 'error' ? styles.error : ''}`}>
      <span>{toast.message}</span>
      <button
        type="button"
        className={styles.close}
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useToasts((state) => state.toasts)
  return (
    <div className={styles.region} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
