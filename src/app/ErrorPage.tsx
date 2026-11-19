import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { logger } from '@/shared/lib/logger'
import styles from './ErrorPage.module.css'

export function ErrorPage() {
  const error = useRouteError()
  logger.error('render error', {
    message: error instanceof Error ? error.message : String(error),
  })
  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <main className={styles.page}>
      <h1>{notFound ? 'Page not found' : 'Something went wrong'}</h1>
      <p>
        {notFound
          ? 'This page does not exist.'
          : 'An unexpected error stopped this page from loading.'}
      </p>
      <p>
        <Link to="/">Back to the start</Link>
      </p>
    </main>
  )
}
