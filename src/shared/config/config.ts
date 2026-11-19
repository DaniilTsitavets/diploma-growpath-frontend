import { parseEnv, type AppConfig } from './env'

let cached: AppConfig | undefined

export function getConfig(): AppConfig {
  cached ??= parseEnv(import.meta.env)
  return cached
}
