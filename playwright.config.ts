import { defineConfig, devices } from '@playwright/test'

// E2E_STATIC=1 tests the production build (`nuxt generate`) served with its real
// `_headers` (CSP, sandbox framing, CORS), exactly like production. CI always does
// this; the default stays the dev server for quick local runs.
const STATIC = process.env.E2E_STATIC === '1'
const PORT = Number(process.env.PORT ?? (STATIC ? 4173 : 3000))
const BASE_URL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: STATIC ? `node scripts/serve-with-headers.mjs .output/public ${PORT}` : 'pnpm dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
