import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useSession } from '@/features/auth/model/session-store'
import { ApiError } from '@/shared/api/api-error'
import { describeError } from '@/shared/api/messages'
import { logger } from '@/shared/lib/logger'
import { Toaster } from '@/shared/ui/Toaster'
import { useToasts } from '@/shared/ui/toast-store'

function isVisitorUnauthorized(error: unknown) {
  return (
    error instanceof ApiError && error.kind === 'unauthorized' && !useSession.getState().session
  )
}

function reportError(error: unknown, handledInline = false) {
  logger.error('request failed', {
    status: error instanceof ApiError ? error.status : undefined,
    code: error instanceof ApiError ? error.code : undefined,
    correlationId: error instanceof ApiError ? error.correlationId : undefined,
    message: error instanceof Error ? error.message : String(error),
  })
  if (!handledInline && !isVisitorUnauthorized(error)) {
    useToasts.getState().push(describeError(error), 'error')
  }
}

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: (error) => reportError(error) }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) =>
        reportError(error, mutation.meta?.handledInline === true),
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (count, error) =>
          !(error instanceof ApiError && error.status < 500 && error.status !== 0) && count < 2,
      },
    },
  })
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient)
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}
