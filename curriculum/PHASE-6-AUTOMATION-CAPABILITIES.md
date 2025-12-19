# Phase 6: From Tests to Automation Capabilities

**Duration**: ~3 hours
**Goal**: Stop thinking in "test files" - start building reusable automation infrastructure.

---

## Learning Objectives

By the end of this phase, you will:

1. Refactor tests into reusable flows
2. Create composable automation actions
3. Build helpers that can be used by tests AND tools
4. Understand the foundation for Playwright MCP

---

## The Mindset Shift

| Test-Centric Thinking | Capability-Centric Thinking |
|----------------------|----------------------------|
| "Write a test for X" | "Build the ability to do X" |
| Tests call page methods | Flows orchestrate pages |
| One test = one file | One capability = many uses |
| Tests are the end product | Tests consume capabilities |

---

## What We're Building

Transform existing tests into:
- **Reusable flows** - Multi-step journeys
- **Subscription selection helpers** - Encapsulated actions
- **Validation utilities** - Structured verification
- **Journey verification** - Health check capabilities

---

## Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FLOWS                               │
│  (Multi-step journeys, orchestrate pages)               │
│  subscription-selection.flow.ts                          │
│  authentication.flow.ts                                  │
│  checkout.flow.ts                                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    PAGE OBJECTS                          │
│  (Single page interactions)                              │
│  subscription-page.ts                                    │
│  signin-page.ts                                          │
│  payment-page.ts                                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     UTILITIES                            │
│  (Data, assertions, helpers)                             │
│  test-data.ts                                            │
│  assertions.ts                                           │
│  environment-guards.ts                                   │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation: Subscription Selection Flow

Create `src/flows/subscription-selection.flow.ts`:

```typescript
import { Page } from '@playwright/test';
import { SubscriptionPage } from '../pages/subscription-page';

/**
 * Subscription Selection Flow
 *
 * Orchestrates the subscription selection journey from landing
 * to authentication page.
 *
 * USE CASES:
 * - Tests: E2E journey validation
 * - Tools: MCP subscription health check
 * - Automation: Scheduled validation
 */

export interface SubscriptionSelectionResult {
  success: boolean;
  tier: 'premium' | 'basic' | null;
  pageReached: 'subscription' | 'signin' | 'error';
  errors: string[];
  durationMs: number;
}

export class SubscriptionSelectionFlow {
  private page: Page;
  private subscriptionPage: SubscriptionPage;

  constructor(page: Page) {
    this.page = page;
    this.subscriptionPage = new SubscriptionPage(page);
  }

  /**
   * Execute full subscription selection flow
   *
   * @param tier - Which subscription tier to select
   * @returns Structured result with status and timing
   */
  async execute(tier: 'premium' | 'basic' = 'premium'): Promise<SubscriptionSelectionResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let pageReached: SubscriptionSelectionResult['pageReached'] = 'error';

    try {
      // Step 1: Navigate to subscription page
      await this.subscriptionPage.goto();
      pageReached = 'subscription';

      // Step 2: Verify page loaded correctly
      if (!(await this.subscriptionPage.isLoaded())) {
        errors.push('Subscription page did not load correctly');
        return this.buildResult(false, null, pageReached, errors, startTime);
      }

      // Step 3: Select the appropriate tier
      if (tier === 'premium') {
        await this.subscriptionPage.selectPremiumSubscription();
      } else {
        await this.subscriptionPage.selectBasicSubscription();
      }

      // Step 4: Verify navigation to sign-in
      pageReached = 'signin';

      return this.buildResult(true, tier, pageReached, errors, startTime);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return this.buildResult(false, null, pageReached, errors, startTime);
    }
  }

  /**
   * Validate subscription page without navigation
   *
   * @returns Validation result
   */
  async validateSubscriptionPage(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    await this.subscriptionPage.goto();

    // Check premium tier
    try {
      await this.subscriptionPage.verifyPremiumTierDisplayed();
    } catch {
      issues.push('Premium tier not displayed correctly');
    }

    // Check basic tier
    try {
      await this.subscriptionPage.verifyBasicTierDisplayed();
    } catch {
      issues.push('Basic tier not displayed correctly');
    }

    // Check CTAs
    const links = await this.subscriptionPage.getSubscriptionLinks();
    if (links.length < 2) {
      issues.push('Missing subscription CTAs');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  private buildResult(
    success: boolean,
    tier: 'premium' | 'basic' | null,
    pageReached: SubscriptionSelectionResult['pageReached'],
    errors: string[],
    startTime: number
  ): SubscriptionSelectionResult {
    return {
      success,
      tier,
      pageReached,
      errors,
      durationMs: Date.now() - startTime,
    };
  }
}
```

---

## Implementation: Authentication Flow

Create `src/flows/authentication.flow.ts`:

```typescript
import { Page } from '@playwright/test';
import { SignInPage } from '../pages/signin-page';

/**
 * Authentication Flow
 *
 * Handles user authentication/registration for subscription purchase.
 */

export interface AuthenticationResult {
  success: boolean;
  authMethod: 'email' | 'social' | null;
  socialProvider?: string;
  pageState: 'signin' | 'password' | 'verification' | 'error';
  errors: string[];
  durationMs: number;
}

export class AuthenticationFlow {
  private page: Page;
  private signInPage: SignInPage;

  constructor(page: Page) {
    this.page = page;
    this.signInPage = new SignInPage(page);
  }

  /**
   * Execute email authentication flow
   */
  async authenticateWithEmail(email: string): Promise<AuthenticationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let pageState: AuthenticationResult['pageState'] = 'signin';

    try {
      // Wait for sign-in page
      await this.signInPage.waitForReady();

      // Enter email
      await this.signInPage.submitEmail(email);

      // Determine what page we're on after submission
      await this.page.waitForTimeout(2000);

      const url = this.page.url();
      if (url.includes('password') || url.includes('verify')) {
        pageState = url.includes('password') ? 'password' : 'verification';
      }

      return {
        success: true,
        authMethod: 'email',
        pageState,
        errors,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        success: false,
        authMethod: null,
        pageState: 'error',
        errors,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Validate sign-in page is functional
   */
  async validateSignInPage(): Promise<{
    isValid: boolean;
    issues: string[];
    socialProvidersAvailable: string[];
  }> {
    const issues: string[] = [];
    const socialProviders: string[] = [];

    try {
      await this.signInPage.waitForReady();
    } catch {
      issues.push('Sign-in page did not load');
      return { isValid: false, issues, socialProvidersAvailable: [] };
    }

    // Check form elements
    try {
      await this.signInPage.verifyFormDisplayed();
    } catch {
      issues.push('Sign-in form not displayed correctly');
    }

    // Check social providers
    try {
      await this.signInPage.verifySocialSignInOptions();
      socialProviders.push('Apple', 'Google', 'Microsoft', 'Facebook');
    } catch {
      issues.push('Social sign-in options not fully available');
    }

    return {
      isValid: issues.length === 0,
      issues,
      socialProvidersAvailable: socialProviders,
    };
  }
}
```

---

## Implementation: Journey Validation Utility

Create `src/utils/journey-validator.ts`:

```typescript
import { Page } from '@playwright/test';
import { SubscriptionSelectionFlow } from '../flows/subscription-selection.flow';
import { AuthenticationFlow } from '../flows/authentication.flow';

/**
 * Journey Validator
 *
 * High-level validation of the subscription journey.
 * Used by tests and MCP tools.
 */

export interface JourneyValidationResult {
  healthy: boolean;
  timestamp: string;
  stages: {
    subscriptionPage: {
      reachable: boolean;
      premiumTierVisible: boolean;
      basicTierVisible: boolean;
      ctasWorking: boolean;
    };
    signInPage: {
      reachable: boolean;
      formFunctional: boolean;
      socialOptionsAvailable: boolean;
    };
  };
  errors: string[];
  totalDurationMs: number;
}

export async function validateSubscriptionJourney(
  page: Page
): Promise<JourneyValidationResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  const result: JourneyValidationResult = {
    healthy: false,
    timestamp: new Date().toISOString(),
    stages: {
      subscriptionPage: {
        reachable: false,
        premiumTierVisible: false,
        basicTierVisible: false,
        ctasWorking: false,
      },
      signInPage: {
        reachable: false,
        formFunctional: false,
        socialOptionsAvailable: false,
      },
    },
    errors: [],
    totalDurationMs: 0,
  };

  try {
    // Validate subscription page
    const subscriptionFlow = new SubscriptionSelectionFlow(page);
    const pageValidation = await subscriptionFlow.validateSubscriptionPage();

    result.stages.subscriptionPage.reachable = true;
    result.stages.subscriptionPage.premiumTierVisible =
      !pageValidation.issues.some((i) => i.includes('Premium'));
    result.stages.subscriptionPage.basicTierVisible =
      !pageValidation.issues.some((i) => i.includes('Basic'));
    result.stages.subscriptionPage.ctasWorking =
      !pageValidation.issues.some((i) => i.includes('CTA'));

    errors.push(...pageValidation.issues);

    // Navigate to sign-in and validate
    const selectionResult = await subscriptionFlow.execute('premium');

    if (selectionResult.success) {
      result.stages.signInPage.reachable = true;

      const authFlow = new AuthenticationFlow(page);
      const signInValidation = await authFlow.validateSignInPage();

      result.stages.signInPage.formFunctional = signInValidation.isValid;
      result.stages.signInPage.socialOptionsAvailable =
        signInValidation.socialProvidersAvailable.length >= 3;

      errors.push(...signInValidation.issues);
    } else {
      errors.push(...selectionResult.errors);
    }

    // Determine overall health
    result.healthy =
      result.stages.subscriptionPage.reachable &&
      result.stages.subscriptionPage.premiumTierVisible &&
      result.stages.subscriptionPage.ctasWorking &&
      result.stages.signInPage.reachable;

  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  result.errors = errors;
  result.totalDurationMs = Date.now() - startTime;

  return result;
}
```

---

## Using Capabilities in Tests

Now tests become simpler and more focused:

```typescript
import { test, expect } from '@playwright/test';
import { SubscriptionSelectionFlow } from '../../src/flows/subscription-selection.flow';
import { validateSubscriptionJourney } from '../../src/utils/journey-validator';

test.describe('Subscription Journey (Using Flows)', () => {
  test('should complete subscription selection flow', async ({ page }) => {
    const flow = new SubscriptionSelectionFlow(page);
    const result = await flow.execute('premium');

    expect(result.success).toBe(true);
    expect(result.pageReached).toBe('signin');
    expect(result.durationMs).toBeLessThan(30000);
  });

  test('should validate entire journey health', async ({ page }) => {
    const validation = await validateSubscriptionJourney(page);

    expect(validation.healthy).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
});
```

---

## Key Takeaways

1. **Flows orchestrate pages** - Higher-level abstraction than page objects
2. **Structured results** enable tooling - Not just pass/fail
3. **Same code, multiple uses** - Tests, tools, health checks
4. **Separation of concerns** - Validation logic independent of test framework

---

## Next Phase Preview

In **Phase 7**, you'll turn these capabilities into Playwright MCP tools:
- Define tool schemas
- Return structured outputs
- Make automation AI-callable

---

**Phase 6 Complete!** You've built reusable automation capabilities.
