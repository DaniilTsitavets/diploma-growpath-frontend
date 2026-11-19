import { refreshTokens, type CognitoConfig } from '../api/cognito'
import { useSession } from './session-store'

const REFRESH_MARGIN_MS = 60_000

/** Returns a usable ID token, refreshing it once for all concurrent callers when it is about to expire. */
export function createSessionService(config: CognitoConfig) {
  let refreshing: Promise<string | null> | undefined

  async function refresh(refreshToken: string): Promise<string | null> {
    try {
      const tokens = await refreshTokens(config, refreshToken)
      useSession.getState().setTokens(tokens)
      return tokens.idToken
    } catch {
      useSession.getState().clear()
      return null
    }
  }

  return {
    async getIdToken(): Promise<string | null> {
      const { session } = useSession.getState()
      if (!session) return null
      if (session.expiresAt - Date.now() > REFRESH_MARGIN_MS) return session.idToken
      refreshing ??= refresh(session.refreshToken).finally(() => {
        refreshing = undefined
      })
      return refreshing
    },
  }
}
