# Phase 1: First Smoke Test - "Choose a Subscription"

**Duration**: ~3 hours
**Goal**: Learn Playwright fundamentals by validating the most critical page.

---

## Learning Objectives

By the end of this phase, you will:

1. Write a production-safe smoke test
2. Understand locators vs assertions
3. Use role-based selectors effectively
4. Run tests in headed mode and debug

---

## Real Scenario

A customer lands on **Choose Your Subscription** and must:

1. **See** available subscription options
2. **Understand** pricing and duration
3. **Proceed** to the next step via CTA

**Business Risk**: If this page breaks, no new subscriptions happen.

---

## What We're Building

A smoke test that:
- Navigates to the subscription page
- Asserts subscription options are visible
- Confirms the primary CTA is usable

---

## Copilot Interaction Guide

### Step 1: Ask Copilot About Business Risk

Open Copilot Chat and ask:

> "I'm testing a subscription page at https://www.mailsubscriptions.co.uk/info/425365/choose-your-subscription. What are the critical things to verify in a smoke test? Remember this is production-safe."

**Expected Response**: Copilot should discuss:
- Page loads successfully
- Subscription options visible
- Pricing displayed
- CTA buttons functional

### Step 2: Ask Copilot to Explain Locators

> "Explain the difference between locators and assertions in Playwright. When should I use each?"

**Expected Response**: Copilot explains:
- **Locators**: Find elements (`page.getByRole()`, `page.locator()`)
- **Assertions**: Verify state (`expect().toBeVisible()`, `expect().toContainText()`)

### Step 3: Request Selector Strategy

> "What's the best selector strategy for testing this subscription page? Should I use CSS selectors, test IDs, or role-based locators?"

**Expected Response**: Copilot recommends role-based selectors first, explains why.

---

## Implementation Walkthrough

### Creating the Test File

Create `tests/smoke/subscription-page.smoke.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

/**
 * Smoke Test: Subscription Page
 *
 * BUSINESS RISK: If this page breaks, no new subscriptions happen.
 * This is the entry point for all subscription revenue.
 *
 * TEST TYPE: Smoke (production-safe, read-only)
 * ENVIRONMENT: Any (including production)
 */

test.describe('Subscription Page - Smoke Tests', () => {
  // Navigate to subscription page before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/info/425365/choose-your-subscription');
  });

  test('should load subscription page successfully', async ({ page }) => {
    // WHAT: Verify the page loads without errors
    // WHY: Basic availability check - if this fails, nothing else works
    // BUSINESS RISK: Site outage = zero subscriptions

    await expect(page).toHaveTitle(/Daily Mail/);
    await expect(page.getByText('Choose your subscription')).toBeVisible();
  });

  test('should display DailyMail+ premium subscription option', async ({ page }) => {
    // WHAT: Verify premium subscription is visible with pricing
    // WHY: This is the highest-value subscription option
    // BUSINESS RISK: Hidden option = lost premium revenue

    const premiumCard = page.locator('text=DailyMail+').first();
    await expect(premiumCard).toBeVisible();

    // Verify pricing is displayed
    await expect(page.getByText('£9.99/month')).toBeVisible();

    // Verify "BEST VALUE" badge
    await expect(page.getByText('BEST VALUE')).toBeVisible();
  });

  test('should display DailyMail+ Basic subscription option', async ({ page }) => {
    // WHAT: Verify basic subscription is visible with pricing
    // WHY: Alternative option for price-sensitive customers
    // BUSINESS RISK: Hidden option = customers may leave without subscribing

    await expect(page.getByText('DailyMail+ Basic')).toBeVisible();
    await expect(page.getByText('£6.99/month')).toBeVisible();
  });

  test('should have clickable subscription CTAs', async ({ page }) => {
    // WHAT: Verify subscription buttons are interactive
    // WHY: Non-clickable CTAs = zero conversions
    // BUSINESS RISK: Broken buttons = customers can't proceed

    // Find the subscription links
    const subscriptionLinks = page.getByRole('link', { name: /First month free/i });

    // Verify at least 2 subscription options have CTAs
    await expect(subscriptionLinks).toHaveCount(2);

    // Verify first CTA is enabled and visible
    const firstCTA = subscriptionLinks.first();
    await expect(firstCTA).toBeVisible();
    await expect(firstCTA).toBeEnabled();
  });

  test('should display subscription benefits', async ({ page }) => {
    // WHAT: Verify key benefits are listed
    // WHY: Benefits drive conversion decisions
    // BUSINESS RISK: Missing benefits = lower conversion rate

    const expectedBenefits = [
      'Unlimited access to the Daily Mail',
      '850 exclusive articles',
      '80% fewer ads',
    ];

    for (const benefit of expectedBenefits) {
      await expect(page.getByText(benefit, { exact: false })).toBeVisible();
    }
  });

  test('should handle cookie consent gracefully', async ({ page }) => {
    // WHAT: Verify cookie banner appears and can be dismissed
    // WHY: Cookie banner blocking content = poor UX
    // BUSINESS RISK: Inaccessible page due to cookie modal

    // Check if cookie banner appears
    const cookieBanner = page.locator('text=Got it').or(page.locator('text=Accept'));

    // If banner exists, dismiss it
    if (await cookieBanner.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cookieBanner.click();
      // Verify banner is dismissed
      await expect(cookieBanner).not.toBeVisible({ timeout: 5000 });
    }

    // Subscription content should be accessible
    await expect(page.getByText('Choose your subscription')).toBeVisible();
  });
});
```

---

## Running Your Tests

### Run All Smoke Tests

```bash
npm run test:smoke
```

### Run in Headed Mode (See the Browser)

```bash
npx playwright test tests/smoke/subscription-page.smoke.spec.ts --headed
```

### Run with UI Mode (Interactive)

```bash
npx playwright test tests/smoke/subscription-page.smoke.spec.ts --ui
```

### Debug a Specific Test

```bash
npx playwright test tests/smoke/subscription-page.smoke.spec.ts --debug
```

---

## Skills Checkpoint

### Ask Copilot to Quiz You

> "Quiz me on Playwright locators. What's the difference between page.locator(), page.getByRole(), and page.getByText()? When should I use each?"

### Self-Assessment Questions

1. Why is `getByRole('link')` preferred over `locator('a')`?
2. What does "smoke test" mean and why is it production-safe?
3. How does Playwright's auto-waiting help prevent flaky tests?
4. Why do we use `beforeEach` instead of navigating in each test?

---

## Common Mistakes & Fixes

### Mistake 1: Using Fragile Selectors

```typescript
// BAD - CSS class may change
await page.click('.sc-1a2b3c4d');

// GOOD - Role-based, semantic
await page.getByRole('button', { name: 'Subscribe' }).click();
```

### Mistake 2: No Assertion After Navigation

```typescript
// BAD - No verification page loaded
await page.goto('/subscription');

// GOOD - Verify expected content
await page.goto('/subscription');
await expect(page.getByRole('heading')).toContainText('Choose');
```

### Mistake 3: Testing Implementation Instead of Behavior

```typescript
// BAD - Testing internal structure
await expect(page.locator('div.subscription-card')).toHaveCount(2);

// GOOD - Testing user-visible behavior
await expect(page.getByText('DailyMail+')).toBeVisible();
await expect(page.getByText('DailyMail+ Basic')).toBeVisible();
```

---

## Key Takeaways

1. **Smoke tests verify critical functionality** in a read-only way
2. **Role-based selectors** are more stable than CSS classes
3. **Assertions should reflect user expectations**, not implementation
4. **Every test documents business risk** through comments
5. **beforeEach** ensures test isolation

---

## Next Phase Preview

In **Phase 2**, you'll expand from single tests to parameterized regression coverage:

- Test all subscription variants systematically
- Learn data-driven testing
- Handle subscription options that may vary

**Homework:**
1. Run your smoke tests 3 times - are they consistent?
2. Try breaking a test intentionally - does the error message help?
3. Think: What edge cases might exist for subscription options?

---

**Phase 1 Complete!** You've written your first production-safe smoke test.
