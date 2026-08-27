import { defineConfig, devices } from '@playwright/test';
import { config } from './src/utils/ConfigManager';

/**
 * Key design decisions (see README for full rationale):
 * - fullyParallel + configurable workers: enables both local parallelism
 *   and CI-level sharding (see --shard usage in package.json / CI workflow).
 * - retries: 2 on CI only. Local runs fail fast so devs see real failures
 *   immediately; CI retries absorb genuine environmental flakiness without
 *   masking a truly broken test (a test failing on both attempts still fails
 *   the build).
 * - trace/video/screenshot are all "on-first-retry" / "only-on-failure" so
 *   we get full observability on anything that actually failed, without
 *   bloating artifacts on every green run.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI
    ? [
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['blob'],
        ['list'],
      ]
    : [['html', { open: 'on-failure' }], ['list']],
  use: {
    baseURL: config.baseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
