import { ApiError } from '@/shared/api/api-error'

export interface CognitoConfig {
  endpoint: string
  clientId: string
}

export interface Tokens {
  idToken: string
  refreshToken: string
}

interface AuthResult {
  AuthenticationResult?: { IdToken?: string; RefreshToken?: string }
  ChallengeName?: string
}

async function initiateAuth(
  config: CognitoConfig,
  flow: 'USER_PASSWORD_AUTH' | 'REFRESH_TOKEN_AUTH',
  parameters: Record<string, string>,
): Promise<AuthResult> {
  let response: Response
  try {
    response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      },
      body: JSON.stringify({
        AuthFlow: flow,
        ClientId: config.clientId,
        AuthParameters: parameters,
      }),
    })
  } catch (cause) {
    throw new ApiError({
      status: 0,
      title: 'Network error',
      detail: cause instanceof Error ? cause.message : undefined,
    })
  }
  const body = (await response.json().catch(() => ({}))) as AuthResult & {
    __type?: string
    message?: string
  }
  if (!response.ok) {
    const credentials =
      body.__type?.includes('NotAuthorized') || body.__type?.includes('UserNotFound')
    throw new ApiError({
      status: response.status,
      title: body.__type ?? 'Sign-in failed',
      detail: credentials ? 'Incorrect email or password.' : body.message,
      code: body.__type,
    })
  }
  return body
}

export async function signIn(
  config: CognitoConfig,
  email: string,
  password: string,
): Promise<Tokens> {
  const result = await initiateAuth(config, 'USER_PASSWORD_AUTH', {
    USERNAME: email,
    PASSWORD: password,
  })
  const idToken = result.AuthenticationResult?.IdToken
  const refreshToken = result.AuthenticationResult?.RefreshToken
  if (!idToken || !refreshToken) {
    throw new ApiError({
      status: 400,
      title: 'Sign-in not completed',
      detail: result.ChallengeName
        ? `Additional step required (${result.ChallengeName}); it is not supported.`
        : 'No tokens were returned.',
    })
  }
  return { idToken, refreshToken }
}

export async function refreshTokens(config: CognitoConfig, refreshToken: string): Promise<Tokens> {
  const result = await initiateAuth(config, 'REFRESH_TOKEN_AUTH', { REFRESH_TOKEN: refreshToken })
  const idToken = result.AuthenticationResult?.IdToken
  if (!idToken) throw new ApiError({ status: 401, title: 'Session cannot be refreshed' })
  return { idToken, refreshToken: result.AuthenticationResult?.RefreshToken ?? refreshToken }
}
