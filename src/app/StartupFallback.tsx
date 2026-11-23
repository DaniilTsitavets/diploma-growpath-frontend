import { Skeleton } from '@/shared/ui/Skeleton'

/** Shown while the first page's code is being loaded, so the router has something to render instead of a blank screen. */
export function StartupFallback() {
  return (
    <div aria-busy="true">
      <p className="visually-hidden" role="status">
        Loading GrowPath
      </p>
      <Skeleton height="title" width={40} />
    </div>
  )
}
