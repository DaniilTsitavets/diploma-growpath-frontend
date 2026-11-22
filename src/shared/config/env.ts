import { z } from 'zod'

const envSchema = z.object({
  VITE_COGNITO_ENDPOINT: z.url(),
  VITE_COGNITO_CLIENT_ID: z.string().min(1),
  /** Where the item pictures live; without it every item shows its placeholder. */
  VITE_MEDIA_BASE_URL: z.url().optional(),
})

export function parseEnv(raw: Record<string, unknown>) {
  const result = envSchema.safeParse(raw)
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join('.')).join(', ')
    throw new Error(`Invalid environment configuration: ${names}. See .env.example.`)
  }
  const env = result.data
  return {
    cognitoEndpoint: env.VITE_COGNITO_ENDPOINT.replace(/\/+$/, ''),
    cognitoClientId: env.VITE_COGNITO_CLIENT_ID,
    mediaBaseUrl: env.VITE_MEDIA_BASE_URL?.replace(/\/+$/, '') ?? null,
  }
}

export type AppConfig = ReturnType<typeof parseEnv>
