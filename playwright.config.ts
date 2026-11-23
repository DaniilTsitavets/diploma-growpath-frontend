import { defineConfig, devices } from '@playwright/test'

try {
  // Local settings (LocalStack ids, test accounts) live in the git-ignored .env.local.
  process.loadEnvFile('.env.local')
} catch {
  // No local file: the variables must come from the environment.
}

const baseURL = 'http://127.0.0.1:5173'
const previewURL = 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL, trace: 'retain-on-failure', channel: 'chromium' },
  projects: [
    {
      name: 'desktop',
      testIgnore: /responsive\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, hasTouch: true },
    },
  ],
  webServer: [
    { command: 'npm run dev', url: baseURL, reuseExistingServer: true, timeout: 60_000 },
    // The built application, which is the one the security policy applies to.
    {
      command: 'npm run build && npm run preview',
      url: previewURL,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})
