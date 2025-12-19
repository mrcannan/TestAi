# Phase 5: Environment Strategy - Staging vs Production

**Duration**: ~2 hours
**Goal**: Teach responsible automation with environment-aware testing.

---

## Learning Objectives

By the end of this phase, you will:

1. Configure environment-specific test behavior
2. Implement safe production smoke checks
3. Understand when tests should run in each environment
4. Create environment guards to prevent accidents

---

## Real Scenario

- **Staging**: Full regression testing allowed
- **Production**: Smoke tests only (read-only)

**Business Risk**: Running write operations in production = data corruption, angry customers.

---

## The Golden Rules

| Rule | Staging | Production |
|------|---------|------------|
| Run smoke tests | Yes | Yes |
| Run regression tests | Yes | **NO** |
| Run E2E tests | Yes | **NO** |
| Create test data | Yes | **NO** |
| Submit forms | Yes | **NO** |
| Modify state | Yes | **NO** |
| Read-only operations | Yes | Yes |

---

## Environment Configuration

### Create `config/environments.ts`:

```typescript
/**
 * Environment Configuration
 *
 * Controls test behavior based on target environment.
 * CRITICAL: Production tests must be read-only.
 */

export type Environment = 'staging' | 'production';

export interface EnvironmentConfig {
  name: Environment;
  baseUrl: string;
  allowWriteOperations: boolean;
  allowDataCreation: boolean;
  allowFormSubmission: boolean;
  maxTestTimeout: number;
  retries: number;
}

export const environments: Record<Environment, EnvironmentConfig> = {
  staging: {
    name: 'staging',
    baseUrl: 'https://staging.mailsubscriptions.co.uk',
    allowWriteOperations: true,
    allowDataCreation: true,
    allowFormSubmission: true,
    maxTestTimeout: 60000,
    retries: 2,
  },
  production: {
    name: 'production',
    baseUrl: 'https://www.mailsubscriptions.co.uk',
    allowWriteOperations: false,
    allowDataCreation: false,
    allowFormSubmission: false,
    maxTestTimeout: 30000,
    retries: 1,
  },
};

/**
 * Get current environment from ENV variable
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.ENVIRONMENT || 'staging';
  if (env !== 'staging' && env !== 'production') {
    console.warn(`Unknown environment "${env}", defaulting to staging`);
    return 'staging';
  }
  return env;
}

/**
 * Get environment config
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  return environments[getCurrentEnvironment()];
}

/**
 * Safety check: Is this action allowed in current environment?
 */
export function isActionAllowed(action: 'write' | 'create' | 'submit'): boolean {
  const config = getEnvironmentConfig();
  switch (action) {
    case 'write':
      return config.allowWriteOperations;
    case 'create':
      return config.allowDataCreation;
    case 'submit':
      return config.allowFormSubmission;
  }
}

/**
 * Assert action is allowed, throw if not
 */
export function assertActionAllowed(action: 'write' | 'create' | 'submit'): void {
  if (!isActionAllowed(action)) {
    const env = getCurrentEnvironment();
    throw new Error(
      `SAFETY BLOCK: Action "${action}" is not allowed in ${env} environment`
    );
  }
}
```

### Create Environment-Aware Test Helpers

Create `src/utils/environment-guards.ts`:

```typescript
import { test as base, expect } from '@playwright/test';
import { getEnvironmentConfig, assertActionAllowed, getCurrentEnvironment } from '../../config/environments';

/**
 * Environment-aware test fixture
 *
 * Provides environment information and safety guards to all tests.
 */
export const test = base.extend<{
  environment: ReturnType<typeof getEnvironmentConfig>;
  isProduction: boolean;
  assertCanWrite: () => void;
  assertCanCreate: () => void;
  assertCanSubmit: () => void;
}>({
  environment: async ({}, use) => {
    await use(getEnvironmentConfig());
  },

  isProduction: async ({}, use) => {
    await use(getCurrentEnvironment() === 'production');
  },

  assertCanWrite: async ({}, use) => {
    await use(() => assertActionAllowed('write'));
  },

  assertCanCreate: async ({}, use) => {
    await use(() => assertActionAllowed('create'));
  },

  assertCanSubmit: async ({}, use) => {
    await use(() => assertActionAllowed('submit'));
  },
});

export { expect };

/**
 * Skip test if in production
 * Use for tests that modify state
 */
export function skipInProduction(testFn: typeof test) {
  return testFn.skip(
    () => getCurrentEnvironment() === 'production',
    'This test is skipped in production environment'
  );
}

/**
 * Mark test as production-safe
 * Documentation helper for smoke tests
 */
export function productionSafe(testFn: typeof test) {
  // This is just documentation - the test runs in all environments
  return testFn;
}
```

---

## Updated Playwright Config

Update `playwright.config.ts` with environment awareness:

```typescript
import { defineConfig, devices } from '@playwright/test';
import { getEnvironmentConfig } from './config/environments';

const envConfig = getEnvironmentConfig();

export default defineConfig({
  testDir: './tests',
  timeout: envConfig.maxTestTimeout,
  retries: envConfig.retries,

  use: {
    baseURL: envConfig.baseUrl,
    trace: 'on-first-retry',
  },

  projects: [
    // SMOKE - Runs in ALL environments
    {
      name: 'smoke',
      testDir: './tests/smoke',
      use: { ...devices['Desktop Chrome'] },
    },

    // REGRESSION - Staging only
    {
      name: 'regression',
      testDir: './tests/regression',
      use: { ...devices['Desktop Chrome'] },
      // Skip in production
      ...(envConfig.name === 'production' && { testIgnore: '**/*' }),
    },

    // E2E - Staging only
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
      // Skip in production
      ...(envConfig.name === 'production' && { testIgnore: '**/*' }),
    },
  ],
});
```

---

## Production-Safe Smoke Test Pattern

```typescript
import { test, expect } from '@playwright/test';
import { getEnvironmentConfig } from '../../config/environments';

test.describe('Production Smoke Tests', () => {
  const env = getEnvironmentConfig();

  test('should load subscription page', async ({ page }) => {
    // READ-ONLY: Just navigate and verify content
    await page.goto('/info/425365/choose-your-subscription');
    await expect(page.getByText('Choose your subscription')).toBeVisible();
  });

  test('should NOT submit any forms in production', async ({ page }) => {
    // This test verifies our safety mechanism works
    if (env.name === 'production') {
      // In production, we should only observe
      await page.goto('/info/425365/choose-your-subscription');

      // Click CTA to navigate (safe - just navigation)
      await page.getByRole('link', { name: /First month free/i }).first().click();

      // Verify we reached sign-in page (observation only)
      await expect(page.getByText(/Sign in/i)).toBeVisible();

      // DO NOT fill forms or submit anything
      // Test ends here in production
    }
  });
});
```

---

## Running Tests by Environment

```bash
# Staging (default) - full test suite
npm run test

# Staging explicitly
ENVIRONMENT=staging npm run test

# Production - smoke tests only
ENVIRONMENT=production npm run test:smoke

# DANGEROUS - will be blocked by guards
ENVIRONMENT=production npm run test:regression  # Tests will skip
```

---

## Key Takeaways

1. **Environment guards prevent accidents** - Build safety into the framework
2. **Smoke tests must be read-only** - Never modify production state
3. **Configuration drives behavior** - Tests adapt to environment
4. **Explicit is better than implicit** - Make environment requirements clear
5. **Fail safe** - When in doubt, block the action

---

## Next Phase Preview

In **Phase 6**, you'll refactor tests into reusable automation capabilities:
- Extract flows from tests
- Create composable actions
- Build a foundation for MCP tools

---

**Phase 5 Complete!** You understand environment-safe testing.
