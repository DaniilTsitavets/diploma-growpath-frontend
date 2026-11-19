import { createSessionService } from '@/features/auth/model/session-service'
import { useSession } from '@/features/auth/model/session-store'
import { configureApi } from '@/shared/api/client'
import { createHttpClient } from '@/shared/api/http'
import { getConfig } from '@/shared/config/config'
import { useToasts } from '@/shared/ui/toast-store'

export function bootstrap() {
  const config = getConfig()
  const sessionService = createSessionService({
    endpoint: config.cognitoEndpoint,
    clientId: config.cognitoClientId,
  })
  configureApi(
    createHttpClient({
      getToken: () => sessionService.getIdToken(),
      onUnauthorized: () => {
        if (useSession.getState().session) {
          useSession.getState().clear()
          useToasts.getState().push('Your session has expired. Please sign in again.', 'error')
        }
      },
    }),
  )
}
