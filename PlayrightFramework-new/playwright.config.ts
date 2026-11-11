import { defineConfig, devices } from '@playwright/test';
import { config } from './utils/ConfigManager';

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: 'test-results',
  reporter: [
    ['list'],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        environmentInfo: { environment: config.environment, baseUrl: config.baseUrl },
      },
    ],
  ],
  use: {
    baseURL: config.baseUrl,
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'off',
  },
  projects: [
    {
      name: 'Wingify Login Suite',
      use: { ...devices['Desktop Chrome'], channel: config.browserChannel },
    },
  ],
});
