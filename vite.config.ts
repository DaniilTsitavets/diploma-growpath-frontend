import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { loadEnv, type ViteDevServer } from 'vite'
import { defineConfig } from 'vitest/config'
import { parseOrigins } from './src/shared/security/csp.ts'
import { securityPolicy } from './vite.security.ts'

const MOCK_PORT = 3100

/** `vite --mode mock`: starts the stand-in backend of mock/ next to the dev server and stops it with it. */
function mockBackend() {
  return {
    name: 'growpath-mock-backend',
    apply: 'serve' as const,
    async configureServer(server: ViteDevServer) {
      const module = (await import(new URL('./mock/server/server.mjs', import.meta.url).href)) as {
        createMockServer: () => { listen: (port: number, host: string) => void; close: () => void }
      }
      const backend = module.createMockServer()
      backend.listen(MOCK_PORT, '127.0.0.1')
      server.httpServer?.on('close', () => backend.close())
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const target = env.VITE_GATEWAY_PROXY_TARGET
  const mock = mode === 'mock'
  // The host header is kept in mock mode, so that the upload addresses the stand-in builds point back to this server.
  const mockTarget = { target: `http://127.0.0.1:${MOCK_PORT}` }
  const proxy: Record<string, { target: string; changeOrigin?: boolean }> | undefined = mock
    ? {
        '/v1': mockTarget,
        '/cognito': mockTarget,
        '/media': mockTarget,
        '/mock-storage': mockTarget,
      }
    : target
      ? { '/v1': { target, changeOrigin: true } }
      : undefined

  return {
    plugins: [
      react(),
      ...(mock ? [mockBackend()] : []),
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
      include: ['src/**/*.test.{ts,tsx}', 'mock/**/*.test.mjs'],
      // Tests render whole pages with a user typing; a busy machine must not turn that into a failure.
      testTimeout: 15_000,
    },
  }
})
