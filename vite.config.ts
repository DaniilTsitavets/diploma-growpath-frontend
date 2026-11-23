import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { parseOrigins } from './src/shared/security/csp'
import { securityPolicy } from './vite.security'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const target = env.VITE_GATEWAY_PROXY_TARGET
  const proxy = target ? { '/v1': { target, changeOrigin: true } } : undefined

  return {
    plugins: [
      react(),
      securityPolicy({
        cognitoEndpoint: env.VITE_COGNITO_ENDPOINT,
        mediaBaseUrl: env.VITE_MEDIA_BASE_URL,
        extraOrigins: parseOrigins(env.VITE_CSP_EXTRA_ORIGINS),
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true, proxy },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }
})
