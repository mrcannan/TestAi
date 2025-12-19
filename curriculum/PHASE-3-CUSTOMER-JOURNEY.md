# Phase 3: New Customer Journey - Details & Progression

**Duration**: ~4 hours
**Goal**: Test a real end-to-end flow from subscription selection to checkout readiness.

---

## Learning Objectives

By the end of this phase, you will:

1. Write end-to-end tests that span multiple pages
2. Handle form interactions reliably
3. Manage test data isolation
4. Understand state transitions in user journeys

---

## Real Scenario

A non-subscriber:
1. **Selects** a subscription on the landing page
2. **Enters** required personal details (email, authentication)
3. **Proceeds** toward checkout
4. **Reaches** the payment stage

This is the "happy path" for a new customer conversion.

---

## Journey Map

```
┌─────────────────────┐
│  Choose Subscription │
│  /info/425365/...    │
└──────────┬──────────┘
           │ Click CTA
           ▼
┌─────────────────────┐
│  Sign In / Register  │
│  /signinOrRegister   │
└──────────┬──────────┘
           │ Enter email + Continue
           ▼
┌─────────────────────┐
│  Customer Details    │
│  (Name, Address)     │
└──────────┬──────────┘
           │ Complete form
           ▼
┌─────────────────────┐
│  Payment             │
│  (Card details)      │
└─────────────────────┘
```

---

## What We're Building

An end-to-end test that:
- Selects a subscription tier
- Completes customer authentication/registration
- Validates correct navigation through the flow
- Stops before actual payment (staging safety)

---

## Page Object Model (POM)

### Why Page Objects?

| Without POM | With POM |
|-------------|----------|
| Selectors scattered in tests | Selectors centralized in page class |
| Duplicate code across tests | Reusable methods |
| Hard to maintain | Change in one place |
| Tests know about implementation | Tests express intent |

### Example Comparison

```typescript
// WITHOUT POM (scattered, brittle)
test('select subscription', async ({ page }) => {
  await page.goto('/info/425365/choose-your-subscription');
  await page.click('text=Got it');
  await page.click('a:has-text("First month free")').first();
  await page.fill('input[type="email"]', 'test@example.com');
  await page.click('button:has-text("Continue")');
});

// WITH POM (intent-focused, maintainable)
test('select subscription', async ({ page }) => {
  const subscriptionPage = new SubscriptionPage(page);
  const signInPage = new SignInPage(page);

  await subscriptionPage.goto();
  await subscriptionPage.selectPremiumSubscription();
  await signInPage.enterEmail('test@example.com');
  await signInPage.continue();
});
```

---

## Implementation Walkthrough

### Creating Page Objects

Create `src/pages/subscription-page.ts`:

```typescript
import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object: Subscription Selection Page
 *
 * URL: /info/425365/choose-your-subscription
 * PURPOSE: Entry point for new subscriptions
 */
export class SubscriptionPage {
  readonly page: Page;

  // Locators - define once, use everywhere
  readonly pageHeading: Locator;
  readonly premiumCTA: Locator;
  readonly basicCTA: Locator;
  readonly cookieAcceptButton: Locator;
  readonly bestValueBadge: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators using semantic selectors
    this.pageHeading = page.getByText('Choose your subscription');
    this.premiumCTA = page.getByRole('link', { name: /First month free/i }).first();
    this.basicCTA = page.getByRole('link', { name: /First month free/i }).last();
    this.cookieAcceptButton = page.getByRole('button', { name: 'Got it' });
    this.bestValueBadge = page.getByText('BEST VALUE');
  }

  /**
   * Navigate to the subscription page
   */
  async goto(): Promise<void> {
    await this.page.goto('/info/425365/choose-your-subscription');
    await this.handleCookieConsent();
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Handle cookie consent banner if present
   */
  async handleCookieConsent(): Promise<void> {
    if (await this.cookieAcceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.cookieAcceptButton.click();
      await expect(this.cookieAcceptButton).not.toBeVisible({ timeout: 3000 });
    }
  }

  /**
   * Select the premium (DailyMail+) subscription
   * Navigates to sign-in page
   */
  async selectPremiumSubscription(): Promise<void> {
    await expect(this.premiumCTA).toBeVisible();
    await this.premiumCTA.click();
    // Wait for navigation to sign-in page
    await this.page.waitForURL(/signinOrRegister|mymailaccount/);
  }

  /**
   * Select the basic (DailyMail+ Basic) subscription
   * Navigates to sign-in page
   */
  async selectBasicSubscription(): Promise<void> {
    await expect(this.basicCTA).toBeVisible();
    await this.basicCTA.click();
    await this.page.waitForURL(/signinOrRegister|mymailaccount/);
  }

  /**
   * Verify premium tier is displayed with badge
   */
  async verifyPremiumTierDisplayed(): Promise<void> {
    await expect(this.bestValueBadge).toBeVisible();
    await expect(this.page.getByText('DailyMail+')).toBeVisible();
    await expect(this.page.getByText('£9.99/month')).toBeVisible();
  }

  /**
   * Verify basic tier is displayed
   */
  async verifyBasicTierDisplayed(): Promise<void> {
    await expect(this.page.getByText('DailyMail+ Basic')).toBeVisible();
    await expect(this.page.getByText('£6.99/month')).toBeVisible();
  }

  /**
   * Check if page loaded successfully
   */
  async isLoaded(): Promise<boolean> {
    try {
      await expect(this.pageHeading).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
```

Create `src/pages/signin-page.ts`:

```typescript
import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object: Sign In / Register Page
 *
 * URL: /signinOrRegister (via redirect)
 * PURPOSE: Customer authentication for subscription purchase
 */
export class SignInPage {
  readonly page: Page;

  // Locators
  readonly pageHeading: Locator;
  readonly emailInput: Locator;
  readonly continueButton: Locator;
  readonly appleSignIn: Locator;
  readonly googleSignIn: Locator;
  readonly microsoftSignIn: Locator;
  readonly facebookSignIn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageHeading = page.getByRole('heading', { name: /Sign in or create an account/i });
    this.emailInput = page.getByRole('textbox', { name: /email address/i });
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.appleSignIn = page.getByText('Apple', { exact: true });
    this.googleSignIn = page.getByText('Google', { exact: true });
    this.microsoftSignIn = page.getByText('Microsoft', { exact: true });
    this.facebookSignIn = page.getByText('Facebook', { exact: true });
  }

  /**
   * Wait for sign-in page to be ready
   */
  async waitForReady(): Promise<void> {
    await expect(this.pageHeading).toBeVisible({ timeout: 10000 });
    await expect(this.emailInput).toBeVisible();
  }

  /**
   * Enter email address in the input field
   */
  async enterEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await expect(this.emailInput).toHaveValue(email);
  }

  /**
   * Click the Continue button
   */
  async clickContinue(): Promise<void> {
    await expect(this.continueButton).toBeEnabled();
    await this.continueButton.click();
  }

  /**
   * Complete email entry and continue
   */
  async submitEmail(email: string): Promise<void> {
    await this.enterEmail(email);
    await this.clickContinue();
  }

  /**
   * Verify social sign-in options are available
   */
  async verifySocialSignInOptions(): Promise<void> {
    await expect(this.appleSignIn).toBeVisible();
    await expect(this.googleSignIn).toBeVisible();
    await expect(this.microsoftSignIn).toBeVisible();
    await expect(this.facebookSignIn).toBeVisible();
  }

  /**
   * Check if on sign-in page
   */
  async isOnSignInPage(): Promise<boolean> {
    try {
      await expect(this.pageHeading).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
```

### Creating the E2E Test

Create `tests/e2e/new-customer-journey.e2e.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { SubscriptionPage } from '../../src/pages/subscription-page';
import { SignInPage } from '../../src/pages/signin-page';
import { generateTestCustomer } from '../../src/utils/test-data';

/**
 * E2E Test: New Customer Subscription Journey
 *
 * BUSINESS RISK: If new customers can't complete subscription, no new revenue.
 * TEST TYPE: E2E (staging only, full journey validation)
 * ENVIRONMENT: Staging only - creates test data
 *
 * Journey: Subscription Page → Sign In → [Customer Details] → [Payment]
 *
 * NOTE: We stop at payment to avoid actual charges in staging.
 */

test.describe('New Customer Journey - E2E Tests', () => {
  let subscriptionPage: SubscriptionPage;
  let signInPage: SignInPage;
  let testCustomer: ReturnType<typeof generateTestCustomer>;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    subscriptionPage = new SubscriptionPage(page);
    signInPage = new SignInPage(page);

    // Generate unique test customer for this test run
    testCustomer = generateTestCustomer('e2e');
  });

  test.describe('Journey Start: Subscription Selection', () => {
    test('should navigate from subscription page to sign-in', async ({ page }) => {
      // WHAT: Verify clicking subscription CTA leads to sign-in
      // WHY: This is the first conversion step
      // BUSINESS RISK: Broken navigation = 100% drop-off

      await subscriptionPage.goto();
      await subscriptionPage.verifyPremiumTierDisplayed();
      await subscriptionPage.selectPremiumSubscription();

      // Verify we reached the sign-in page
      await signInPage.waitForReady();
      expect(await signInPage.isOnSignInPage()).toBe(true);
    });

    test('should work for both subscription tiers', async ({ page }) => {
      // Test premium path
      await subscriptionPage.goto();
      await subscriptionPage.selectPremiumSubscription();
      await signInPage.waitForReady();

      // Go back and test basic path
      await subscriptionPage.goto();
      await subscriptionPage.selectBasicSubscription();
      await signInPage.waitForReady();

      // Both paths should reach sign-in
      expect(await signInPage.isOnSignInPage()).toBe(true);
    });
  });

  test.describe('Journey Step: Authentication', () => {
    test.beforeEach(async () => {
      // Start from subscription page for each auth test
      await subscriptionPage.goto();
      await subscriptionPage.selectPremiumSubscription();
      await signInPage.waitForReady();
    });

    test('should display email input and continue button', async ({ page }) => {
      // WHAT: Verify sign-in form elements are present
      // WHY: Form must be usable for new customers
      // BUSINESS RISK: Hidden/broken form = can't proceed

      await expect(signInPage.emailInput).toBeVisible();
      await expect(signInPage.emailInput).toBeEnabled();
      await expect(signInPage.continueButton).toBeVisible();
    });

    test('should display social sign-in options', async ({ page }) => {
      // WHAT: Verify alternative authentication methods
      // WHY: Social sign-in reduces friction
      // BUSINESS RISK: Missing social options = lost conversions

      await signInPage.verifySocialSignInOptions();
    });

    test('should accept email input', async ({ page }) => {
      // WHAT: Verify email can be entered
      // WHY: Email is required for account creation
      // BUSINESS RISK: Broken input = can't proceed

      await signInPage.enterEmail(testCustomer.email);
      await expect(signInPage.emailInput).toHaveValue(testCustomer.email);
    });

    test('should enable continue button after email entry', async ({ page }) => {
      // WHAT: Verify form validation allows progression
      // WHY: Continue button must work after valid email
      // BUSINESS RISK: Stuck button = abandoned journey

      await signInPage.enterEmail(testCustomer.email);
      await expect(signInPage.continueButton).toBeEnabled();
    });
  });

  test.describe('Journey Flow: Full Happy Path', () => {
    test('should complete subscription selection through to authentication', async ({ page }) => {
      // WHAT: Full journey from landing to authentication
      // WHY: End-to-end validation of critical path
      // BUSINESS RISK: Any break in chain = lost sale

      // Step 1: Land on subscription page
      await subscriptionPage.goto();
      await subscriptionPage.verifyPremiumTierDisplayed();

      // Step 2: Select subscription
      await subscriptionPage.selectPremiumSubscription();

      // Step 3: Arrive at sign-in
      await signInPage.waitForReady();

      // Step 4: Enter email
      await signInPage.enterEmail(testCustomer.email);

      // Step 5: Click continue
      await signInPage.clickContinue();

      // Verify progression - should move to next step
      // Note: Next step depends on whether email is new or existing
      // For new email: should go to registration/password creation
      // For existing email: should go to password entry

      // Wait for any navigation/state change
      await page.waitForTimeout(2000);

      // Verify we're no longer on the initial sign-in page OR
      // Verify a new form element appeared (password, verification, etc.)
      const pageUrl = page.url();
      const hasProgressed =
        !pageUrl.includes('signinOrRegister') ||
        (await page.getByText(/password|verify|create/i).isVisible().catch(() => false));

      expect(hasProgressed, 'Should progress past initial email entry').toBe(true);
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async () => {
      await subscriptionPage.goto();
      await subscriptionPage.selectPremiumSubscription();
      await signInPage.waitForReady();
    });

    test('should handle invalid email format', async ({ page }) => {
      // WHAT: Verify form validation for invalid emails
      // WHY: Bad data should be caught early
      // BUSINESS RISK: Invalid emails = failed registrations

      await signInPage.enterEmail('not-an-email');
      await signInPage.clickContinue();

      // Should show validation error or prevent submission
      // Exact behavior depends on implementation
      await page.waitForTimeout(1000);

      // Should still be on sign-in page (not progressed)
      expect(await signInPage.isOnSignInPage()).toBe(true);
    });

    test('should handle empty email submission', async ({ page }) => {
      // WHAT: Verify form requires email
      // WHY: Empty submissions waste resources
      // BUSINESS RISK: Broken validation = error states

      // Try to continue without entering email
      await signInPage.clickContinue();

      // Should remain on sign-in page
      await page.waitForTimeout(1000);
      expect(await signInPage.isOnSignInPage()).toBe(true);
    });
  });
});
```

---

## Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in headed mode (watch the browser)
npx playwright test tests/e2e/ --headed

# Run with debug mode (step through)
npx playwright test tests/e2e/ --debug

# Run a specific test
npx playwright test tests/e2e/new-customer-journey.e2e.spec.ts
```

---

## Skills Checkpoint

### Copilot Interaction

> "Review my page object for SubscriptionPage. What patterns am I following well? What could be improved?"

> "Explain the benefits of using test.beforeEach for initializing page objects vs creating them in each test."

### Self-Assessment

1. Why do we use Page Objects instead of raw selectors in tests?
2. What's the difference between `toBeVisible` and `isVisible`?
3. Why do we generate unique test customers for each test run?
4. When should we use `waitForURL` vs checking page content?

---

## Key Takeaways

1. **Page Objects encapsulate page knowledge** - Tests express intent, not implementation
2. **Test data isolation prevents conflicts** - Unique data per test run
3. **State transitions need explicit verification** - Don't assume navigation succeeded
4. **E2E tests are valuable but expensive** - Reserve for critical paths

---

## Next Phase Preview

In **Phase 4**, you'll handle the most sensitive part:
- Payment form interaction
- Success and failure scenarios
- Network interception for controlled testing

**Homework:**
1. Add another page object for a new page you discover
2. Think about edge cases in authentication (existing user, social sign-in)
3. Consider: How would you test payment without real charges?

---

**Phase 3 Complete!** You've built Page Objects and E2E journey tests.
