import { defineConfig } from '@playwright/test'

// Run explicitly with `npx playwright test --config tests/live.config.ts`.
// The local `deepspace test run all` suite does not include live.check.ts.
export default defineConfig({
  testDir: '.',
  testMatch: 'live.check.ts',
  timeout: 90_000,
  retries: 0,
  use: {
    baseURL: process.env.PROOFBOARD_LIVE_URL ?? 'https://proofboard-dhyan.app.space',
    headless: true,
  },
})
