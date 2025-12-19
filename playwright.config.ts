import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for TestPilot AI Curriculum
 *
 * This config supports multiple test types:
 * - Smoke tests: Production-safe, read-only validation
 * - Regression tests: Staging-only, comprehensive coverage
 * - E2E tests: Full journey tests with data isolation
 */

// Environment configuration
const environment = process.env.ENVIRONMENT || 'staging';

const baseURLs = {
  staging: 'https://www.mailsubscriptions.co.uk',
  production: 'https://www.mailsubscriptions.co.uk',
};

export default defineConfig({
  // Test directory
  testDir: './tests',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Maximum time expect() should wait for condition
  expect: {
    timeout: 10 * 1000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: baseURLs[environment as keyof typeof baseURLs],

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording
    video: 'on-first-retry',

    // Browser context options
    viewport: { width: 1280, height: 720 },

    // Emulate user behavior
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for different test types and browsers
  projects: [
    // ============================================
    // SMOKE TESTS - Production Safe
    // ============================================
    {
      name: 'smoke-chromium',
      testDir: './tests/smoke',
      use: {
        ...devices['Desktop Chrome'],
        // Smoke tests are read-only, no state modification
      },
      metadata: {
        type: 'smoke',
        environment: 'any',
        description: 'Production-safe smoke tests',
      },
    },
    {
      name: 'smoke-firefox',
      testDir: './tests/smoke',
      use: {
        ...devices['Desktop Firefox'],
      },
      metadata: {
        type: 'smoke',
        environment: 'any',
      },
    },
    {
      name: 'smoke-webkit',
      testDir: './tests/smoke',
      use: {
        ...devices['Desktop Safari'],
      },
      metadata: {
        type: 'smoke',
        environment: 'any',
      },
    },

    // ============================================
    // REGRESSION TESTS - Staging Only
    // ============================================
    {
      name: 'regression-chromium',
      testDir: './tests/regression',
      use: {
        ...devices['Desktop Chrome'],
      },
      metadata: {
        type: 'regression',
        environment: 'staging',
        description: 'Comprehensive regression tests - staging only',
      },
    },

    // ============================================
    // E2E TESTS - Full Journey Tests
    // ============================================
    {
      name: 'e2e-chromium',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
      },
      metadata: {
        type: 'e2e',
        environment: 'staging',
        description: 'End-to-end journey tests',
      },
    },

    // ============================================
    // MOBILE TESTS
    // ============================================
    {
      name: 'mobile-chrome',
      testDir: './tests/smoke',
      use: {
        ...devices['Pixel 5'],
      },
      metadata: {
        type: 'smoke',
        environment: 'any',
        description: 'Mobile smoke tests',
      },
    },
    {
      name: 'mobile-safari',
      testDir: './tests/smoke',
      use: {
        ...devices['iPhone 12'],
      },
      metadata: {
        type: 'smoke',
        environment: 'any',
        description: 'Mobile Safari smoke tests',
      },
    },
  ],

  // Output directory for test artifacts
  outputDir: 'test-results/',

  // Global setup and teardown
  // globalSetup: require.resolve('./config/global-setup'),
  // globalTeardown: require.resolve('./config/global-teardown'),
});
