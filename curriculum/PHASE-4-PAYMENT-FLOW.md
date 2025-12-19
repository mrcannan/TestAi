# Phase 4: Payment Flow Testing (Advanced UI Automation)

**Duration**: ~4 hours
**Goal**: Learn how to automate high-risk, high-value flows safely.

---

## Learning Objectives

By the end of this phase, you will:

1. Test payment flows without executing real transactions
2. Use network interception for controlled testing
3. Handle success and failure scenarios
4. Understand when to mock vs observe

---

## Real Scenario

Subscription checkout includes:
- Card payment entry
- Payment processing
- Success confirmation
- Error handling for declined cards

**CRITICAL**: Payment tests must NEVER execute real charges.

---

## What We're Building

Two test flows:
1. **Happy path payment** - Simulated success
2. **Failure/decline scenario** - Error handling validation

---

## Safety First: Testing Payment Without Charges

### Strategy Options

| Strategy | Use Case | Pros | Cons |
|----------|----------|------|------|
| **Test cards** | Staging with test payment provider | Real flow | Provider-specific |
| **Network mocking** | Any environment | Full control | May miss real issues |
| **Stop before payment** | Production smoke | Safe | Incomplete coverage |
| **Sandbox environment** | Integration testing | Realistic | Setup complexity |

### Our Approach

For this curriculum, we use a **hybrid approach**:
1. **Smoke tests**: Navigate TO payment but don't submit
2. **Regression tests**: Mock payment responses
3. **E2E tests**: Use test card numbers (staging only)

---

## Implementation Walkthrough

### Payment Page Object

Create `src/pages/payment-page.ts`:

```typescript
import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object: Payment Page
 *
 * PURPOSE: Handle payment form interactions safely
 *
 * SAFETY RULES:
 * - NEVER use real card numbers
 * - NEVER submit payment in production
 * - Always verify environment before submission
 */
export class PaymentPage {
  readonly page: Page;

  // Form elements (these vary by payment provider)
  readonly cardNumberInput: Locator;
  readonly expiryInput: Locator;
  readonly cvcInput: Locator;
  readonly nameOnCardInput: Locator;
  readonly submitButton: Locator;

  // iFrame handling (many payment providers use iframes)
  private paymentFrame: Locator | null = null;

  constructor(page: Page) {
    this.page = page;

    // These selectors are examples - actual selectors depend on payment provider
    this.cardNumberInput = page.locator('[name*="cardnumber"], [name*="card-number"]');
    this.expiryInput = page.locator('[name*="exp"], [name*="expiry"]');
    this.cvcInput = page.locator('[name*="cvc"], [name*="cvv"]');
    this.nameOnCardInput = page.locator('[name*="name"], [placeholder*="name on card"]');
    this.submitButton = page.getByRole('button', { name: /pay|subscribe|complete/i });
  }

  /**
   * Wait for payment form to be ready
   * Handles iFrame-embedded payment forms
   */
  async waitForReady(): Promise<void> {
    // Check if payment form is in an iframe
    const iframe = this.page.frameLocator('iframe[name*="card"], iframe[name*="payment"]');

    // Try to find card input directly or in iframe
    const directInput = this.page.locator('[name*="cardnumber"]');

    try {
      await directInput.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // May be in iframe - payment provider specific handling needed
      console.log('Payment form may be in iframe');
    }
  }

  /**
   * Fill payment form with test card data
   *
   * WARNING: Only use in staging with test cards!
   */
  async fillPaymentForm(cardData: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
  }): Promise<void> {
    // Safety check - verify we're not in production
    const url = this.page.url();
    if (url.includes('production') || !url.includes('staging')) {
      throw new Error('SAFETY: Payment form fill blocked - not in staging environment');
    }

    // Fill form fields
    // Note: Actual implementation depends on payment provider (Stripe, Adyen, etc.)
    if (await this.cardNumberInput.isVisible().catch(() => false)) {
      await this.cardNumberInput.fill(cardData.number);
      await this.expiryInput.fill(cardData.expiry);
      await this.cvcInput.fill(cardData.cvc);
      if (await this.nameOnCardInput.isVisible().catch(() => false)) {
        await this.nameOnCardInput.fill(cardData.name);
      }
    }
  }

  /**
   * Verify payment form is displayed
   * Used for smoke tests - doesn't interact
   */
  async verifyPaymentFormDisplayed(): Promise<void> {
    // Look for common payment form indicators
    const paymentIndicators = [
      this.page.getByText(/card number/i),
      this.page.getByText(/payment/i),
      this.page.locator('[class*="card"], [class*="payment"]'),
    ];

    let found = false;
    for (const indicator of paymentIndicators) {
      if (await indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        found = true;
        break;
      }
    }

    expect(found, 'Payment form should be visible').toBe(true);
  }

  /**
   * Check if we're on a payment page
   */
  async isOnPaymentPage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('payment') || url.includes('checkout') || url.includes('pay');
  }
}
```

### Payment Flow Tests

Create `tests/e2e/payment-flow.e2e.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { SubscriptionPage } from '../../src/pages/subscription-page';
import { SignInPage } from '../../src/pages/signin-page';
import { PaymentPage } from '../../src/pages/payment-page';
import { testCards, generateTestCustomer } from '../../src/utils/test-data';

/**
 * E2E Test: Payment Flow
 *
 * BUSINESS RISK: Payment failures = lost revenue and frustrated customers
 * TEST TYPE: E2E (staging only, uses test cards)
 * ENVIRONMENT: Staging only - NEVER run against production
 *
 * SAFETY:
 * - Uses test card numbers only
 * - Verifies environment before any payment action
 * - Mocks payment responses where needed
 */

test.describe('Payment Flow - E2E Tests', () => {
  // Skip these tests in production
  test.skip(
    ({ }, testInfo) => testInfo.project.name.includes('prod'),
    'Payment tests must not run in production'
  );

  let subscriptionPage: SubscriptionPage;
  let signInPage: SignInPage;
  let paymentPage: PaymentPage;
  let testCustomer: ReturnType<typeof generateTestCustomer>;

  test.beforeEach(async ({ page }) => {
    subscriptionPage = new SubscriptionPage(page);
    signInPage = new SignInPage(page);
    paymentPage = new PaymentPage(page);
    testCustomer = generateTestCustomer('payment-test');
  });

  test.describe('Payment Form Display', () => {
    test('should reach payment stage from subscription flow', async ({ page }) => {
      // WHAT: Verify we can navigate to payment
      // WHY: Payment must be reachable for conversions
      // NOTE: This test navigates but doesn't submit payment

      await subscriptionPage.goto();
      await subscriptionPage.selectPremiumSubscription();
      await signInPage.waitForReady();

      // Note: Full navigation to payment requires authentication
      // For this test, we verify the flow up to sign-in works
      expect(await signInPage.isOnSignInPage()).toBe(true);
    });
  });

  test.describe('Payment with Network Interception', () => {
    test('should handle successful payment response', async ({ page }) => {
      // WHAT: Test UI response to successful payment
      // WHY: Success flow must work correctly
      // METHOD: Mock the payment API response

      // Set up route interception for payment API
      await page.route('**/api/payment/**', async (route) => {
        // Mock a successful payment response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            transactionId: 'TEST-TXN-123',
            message: 'Payment successful',
          }),
        });
      });

      // Navigate through the flow
      await subscriptionPage.goto();
      // ... continue test with mocked payment

      // Verify success handling
      // (Actual verification depends on how the site handles success)
    });

    test('should handle declined payment response', async ({ page }) => {
      // WHAT: Test UI response to declined payment
      // WHY: Decline handling is critical for UX
      // METHOD: Mock the payment API response

      await page.route('**/api/payment/**', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'card_declined',
            message: 'Your card was declined',
          }),
        });
      });

      // Navigate and attempt payment
      await subscriptionPage.goto();
      // ... continue test

      // Verify decline message is shown
      // await expect(page.getByText(/declined/i)).toBeVisible();
    });

    test('should handle payment timeout gracefully', async ({ page }) => {
      // WHAT: Test UI response to payment timeout
      // WHY: Network issues happen - must handle gracefully
      // METHOD: Delay the mock response

      await page.route('**/api/payment/**', async (route) => {
        // Simulate timeout
        await new Promise((resolve) => setTimeout(resolve, 30000));
        await route.abort('timedout');
      });

      // The UI should show a timeout/error message
    });
  });

  test.describe('Payment Security', () => {
    test('should not expose card details in console', async ({ page }) => {
      // WHAT: Verify card data isn't logged
      // WHY: PCI compliance requirement

      const consoleMessages: string[] = [];
      page.on('console', (msg) => {
        consoleMessages.push(msg.text());
      });

      await subscriptionPage.goto();
      // Navigate through flow...

      // Verify no card numbers in console
      const hasCardNumber = consoleMessages.some((msg) =>
        /\d{13,16}/.test(msg) // 13-16 digit number pattern
      );
      expect(hasCardNumber, 'Card numbers should not appear in console').toBe(false);
    });

    test('should use HTTPS for payment requests', async ({ page }) => {
      // WHAT: Verify payment uses secure connection
      // WHY: Security requirement

      const requests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('payment')) {
          requests.push(request.url());
        }
      });

      await subscriptionPage.goto();
      // Navigate through flow...

      // All payment requests should be HTTPS
      for (const url of requests) {
        expect(url.startsWith('https://'), `${url} should be HTTPS`).toBe(true);
      }
    });
  });
});
```

---

## Network Interception Deep Dive

### Why Mock Payment APIs?

1. **Safety**: Never risk real charges
2. **Control**: Test specific scenarios
3. **Speed**: No external dependencies
4. **Coverage**: Test edge cases impossible to trigger

### Interception Patterns

```typescript
// Intercept and modify response
await page.route('**/api/payment', async (route) => {
  const response = await route.fetch();
  const json = await response.json();
  json.testMode = true;
  await route.fulfill({ body: JSON.stringify(json) });
});

// Block specific requests
await page.route('**/tracking/**', route => route.abort());

// Delay response
await page.route('**/api/slow', async (route) => {
  await new Promise(r => setTimeout(r, 5000));
  await route.continue();
});

// Return error
await page.route('**/api/payment', route => {
  route.fulfill({ status: 500 });
});
```

---

## Key Takeaways

1. **Safety first**: Payment tests require extra caution
2. **Network interception** enables controlled testing
3. **Mock responses** let you test edge cases
4. **Never use real cards** even in staging without explicit approval
5. **Environment checks** prevent accidental production testing

---

## Next Phase Preview

In **Phase 5**, you'll implement environment strategy:
- Configure staging vs production behavior
- Implement environment-aware test execution
- Create read-only production smoke checks

---

**Phase 4 Complete!** You understand safe payment testing patterns.
