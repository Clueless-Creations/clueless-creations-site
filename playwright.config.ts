import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm preview',
    url: 'http://localhost:4321',
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
