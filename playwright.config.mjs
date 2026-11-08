import { defineConfig, devices } from '@playwright/test'
const width = Number(process.env.E2E_VIEWPORT_WIDTH || 1120)
const height = Number(process.env.E2E_VIEWPORT_HEIGHT || 600)
export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  expect: { timeout: 12000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list', { printSteps: true }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  outputDir: 'test-results/artifacts',
  use: {
    baseURL: 'http://127.0.0.1:3101',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width, height },
        launchOptions: {
          args: [
            `--window-size=${Math.max(width + 40, 850)},${Math.max(height + 110, 600)}`,
          ],
        },
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3101',
    url: 'http://127.0.0.1:3101',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: { NEXT_PUBLIC_ESHOP_MODE: 'preview', NEXT_TELEMETRY_DISABLED: '1' },
  },
})
