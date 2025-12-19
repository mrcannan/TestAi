# Phase 2: Regression Foundations - Subscription Options & Variants

**Duration**: ~4 hours
**Goal**: Expand from smoke to regression thinking with parameterised tests.

---

## Learning Objectives

By the end of this phase, you will:

1. Understand the difference between smoke and regression testing
2. Write parameterised (data-driven) tests
3. Validate subscription variants systematically
4. Avoid test duplication through smart abstractions

---

## Real Scenario

Subscription offerings may vary by:
- **Duration** (monthly, annual)
- **Pricing** (promotional vs standard)
- **Product bundle** (Premium vs Basic features)

We need to test all variants without duplicating test code.

---

## Smoke vs Regression: The Key Differences

| Aspect | Smoke Test | Regression Test |
|--------|------------|-----------------|
| **Purpose** | "Is it working?" | "Did we break anything?" |
| **Scope** | Critical paths only | Comprehensive coverage |
| **Environment** | Any (including prod) | Staging only |
| **Speed** | Fast (<30 seconds) | Slower (acceptable) |
| **Data** | Read-only | May create test data |
| **When to run** | Every deployment | Pre-release, scheduled |

### Why This Matters

- **Smoke tests** gate deployments - if they fail, don't deploy
- **Regression tests** verify quality - if they fail, investigate before release

---

## What We're Building

A regression test pack that:
- Iterates through subscription options systematically
- Validates pricing visibility for each tier
- Confirms option selection updates state correctly
- Uses parameterisation to avoid code duplication

---

## Copilot Interaction Guide

### Step 1: Ask About Parameterisation

> "Explain Playwright's test parameterisation. How do I run the same test with different data sets?"

### Step 2: Ask About Test Structure

> "I have two subscription tiers (Premium and Basic) with different features and pricing. How should I structure my regression tests to cover both without duplicating code?"

### Step 3: Ask About Data Management

> "What's the best way to manage test data for subscription tiers in Playwright? Should I use fixtures, constants, or external data files?"

---

## Implementation Walkthrough

### Test Data Structure

Create `src/utils/test-data.ts`:

```typescript
/**
 * Test Data: Subscription Tiers
 *
 * This defines all subscription variants for parameterised testing.
 * Update here when subscription offerings change.
 */

export interface SubscriptionTier {
  name: string;
  displayName: string;
  monthlyPrice: string;
  trialPrice: string;
  afterTrialPrice: string;
  features: string[];
  badge?: string;
}

export const subscriptionTiers: SubscriptionTier[] = [
  {
    name: 'premium',
    displayName: 'DailyMail+',
    monthlyPrice: '£9.99/month',
    trialPrice: 'First month free',
    afterTrialPrice: '£1.99/month for 11 months',
    badge: 'BEST VALUE',
    features: [
      'Unlimited access to the Daily Mail',
      'Over 850 exclusive articles per month',
      'Best of DailyMail+ weekly newsletter',
      '80% fewer ads on web',
      '25+ daily premium puzzles',
    ],
  },
  {
    name: 'basic',
    displayName: 'DailyMail+ Basic',
    monthlyPrice: '£6.99/month',
    trialPrice: 'First month free',
    afterTrialPrice: '£1.99/month for 11 months',
    features: [
      'Unlimited access to the Daily Mail',
      'Over 850 exclusive articles per month',
      'Best of DailyMail+ weekly newsletter',
    ],
  },
];

/**
 * FAQ Test Data
 */
export const faqItems = [
  {
    question: 'What is DailyMail+?',
    answerContains: 'subscription service',
  },
  {
    question: 'How can I install the Daily Mail app?',
    answerContains: 'Google Play',
  },
  {
    question: 'What does 80% fewer ads mean?',
    answerContains: 'fewer advertisement placements',
  },
];

/**
 * Marketing Sections
 */
export const marketingSections = [
  {
    heading: 'More of the fantastic stories you love',
    hasImage: true,
  },
  {
    heading: 'Read uninterrupted with 80% fewer ads',
    hasImage: true,
  },
  {
    heading: 'Premium daily puzzles',
    hasImage: true,
  },
  {
    heading: 'Exclusives from the experts',
    hasImage: true,
  },
  {
    heading: 'The best of DailyMail+ delivered direct to your inbox',
    hasImage: true,
  },
  {
    heading: 'All the stories in one place',
    hasImage: true,
  },
];
```

### Regression Test Implementation

Create `tests/regression/subscription-variants.regression.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { subscriptionTiers, faqItems, marketingSections, type SubscriptionTier } from '../../src/utils/test-data';

/**
 * Regression Test: Subscription Variants
 *
 * BUSINESS RISK: Incorrect pricing or features = customer confusion and support load
 * TEST TYPE: Regression (staging only, comprehensive coverage)
 * ENVIRONMENT: Staging only
 *
 * This test pack validates all subscription variants systematically.
 */

test.describe('Subscription Variants - Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/info/425365/choose-your-subscription');

    // Handle cookie consent
    const cookieAcceptButton = page.getByRole('button', { name: 'Got it' });
    if (await cookieAcceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieAcceptButton.click();
      await expect(cookieAcceptButton).not.toBeVisible({ timeout: 3000 });
    }
  });

  // ========================================
  // PARAMETERISED TESTS: Subscription Tiers
  // ========================================

  for (const tier of subscriptionTiers) {
    test.describe(`${tier.displayName} Tier`, () => {
      test(`should display ${tier.displayName} subscription option`, async ({ page }) => {
        // WHAT: Verify tier is visible
        // WHY: Each tier must be discoverable
        await expect(page.getByText(tier.displayName)).toBeVisible();
      });

      test(`should display correct pricing for ${tier.displayName}`, async ({ page }) => {
        // WHAT: Verify pricing matches expected values
        // WHY: Incorrect pricing = legal/trust issues
        await expect(page.getByText(tier.monthlyPrice)).toBeVisible();
        await expect(page.getByText(tier.trialPrice, { exact: false }).first()).toBeVisible();
      });

      if (tier.badge) {
        test(`should display "${tier.badge}" badge for ${tier.displayName}`, async ({ page }) => {
          // WHAT: Verify promotional badge is visible
          // WHY: Badges drive tier selection decisions
          await expect(page.getByText(tier.badge)).toBeVisible();
        });
      }

      test(`should display features for ${tier.displayName}`, async ({ page }) => {
        // WHAT: Verify all tier features are listed
        // WHY: Features differentiate tiers and drive decisions
        for (const feature of tier.features) {
          await expect(
            page.getByText(feature, { exact: false }),
            `Feature "${feature}" should be visible for ${tier.displayName}`
          ).toBeVisible();
        }
      });

      test(`should have working CTA for ${tier.displayName}`, async ({ page }) => {
        // WHAT: Verify CTA is clickable and navigates correctly
        // WHY: Broken CTA = lost conversion

        // Find the CTA within the tier's context
        const tierCard = page.locator(`text=${tier.displayName}`).locator('..').locator('..');
        const cta = tierCard.getByRole('link', { name: /First month free/i });

        await expect(cta).toBeVisible();
        await expect(cta).toBeEnabled();

        // Verify the link has an href (don't click in regression - save for E2E)
        const href = await cta.getAttribute('href');
        expect(href).toBeTruthy();
        expect(href).toContain('themailsubscriptions.co.uk');
      });
    });
  }

  // ========================================
  // PARAMETERISED TESTS: FAQ Section
  // ========================================

  test.describe('FAQ Section', () => {
    for (const faq of faqItems) {
      test(`should display FAQ: "${faq.question}"`, async ({ page }) => {
        // WHAT: Verify FAQ question and answer are present
        // WHY: FAQs reduce support burden
        await expect(page.getByText(faq.question)).toBeVisible();
        await expect(page.getByText(faq.answerContains, { exact: false })).toBeVisible();
      });
    }
  });

  // ========================================
  // PARAMETERISED TESTS: Marketing Sections
  // ========================================

  test.describe('Marketing Content', () => {
    for (const section of marketingSections) {
      test(`should display marketing section: "${section.heading}"`, async ({ page }) => {
        // WHAT: Verify marketing content is present
        // WHY: Marketing content drives conversion
        const heading = page.getByRole('heading', { name: section.heading, exact: false });
        await expect(heading).toBeVisible();

        if (section.hasImage) {
          // Find image near the heading
          const sectionContainer = heading.locator('..').locator('..');
          const image = sectionContainer.getByRole('img', { name: 'marketing image' });
          await expect(image).toBeVisible();
        }
      });
    }
  });

  // ========================================
  // COMPARISON TESTS
  // ========================================

  test.describe('Tier Comparison', () => {
    test('should display all subscription tiers on the same page', async ({ page }) => {
      // WHAT: Verify all tiers visible simultaneously
      // WHY: Customers need to compare options
      for (const tier of subscriptionTiers) {
        await expect(page.getByText(tier.displayName)).toBeVisible();
      }
    });

    test('should show price difference between tiers', async ({ page }) => {
      // WHAT: Verify price differentiation is clear
      // WHY: Price is key decision factor
      const premiumPrice = await page.getByText('£9.99/month').isVisible();
      const basicPrice = await page.getByText('£6.99/month').isVisible();

      expect(premiumPrice).toBe(true);
      expect(basicPrice).toBe(true);
    });

    test('premium tier should have more features than basic', async ({ page }) => {
      // WHAT: Verify premium tier value proposition
      // WHY: Premium must justify higher price

      const premium = subscriptionTiers.find((t) => t.name === 'premium')!;
      const basic = subscriptionTiers.find((t) => t.name === 'basic')!;

      expect(premium.features.length).toBeGreaterThan(basic.features.length);

      // Verify premium-exclusive features are visible
      const premiumExclusiveFeatures = premium.features.filter(
        (f) => !basic.features.some((bf) => f.includes(bf) || bf.includes(f))
      );

      for (const feature of premiumExclusiveFeatures) {
        await expect(page.getByText(feature, { exact: false })).toBeVisible();
      }
    });
  });

  // ========================================
  // EDGE CASE TESTS
  // ========================================

  test.describe('Edge Cases', () => {
    test('should handle page reload gracefully', async ({ page }) => {
      // WHAT: Verify page state after reload
      // WHY: Users may refresh while comparing
      await page.reload();

      // Handle cookie consent again if needed
      const cookieAcceptButton = page.getByRole('button', { name: 'Got it' });
      if (await cookieAcceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cookieAcceptButton.click();
      }

      await expect(page.getByText('Choose your subscription')).toBeVisible();
    });

    test('should display correctly at different viewport sizes', async ({ page }) => {
      // WHAT: Verify responsive design
      // WHY: Users access from various devices

      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByText('Choose your subscription')).toBeVisible();

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByText('Choose your subscription')).toBeVisible();

      // Reset to desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await expect(page.getByText('Choose your subscription')).toBeVisible();
    });
  });
});
```

---

## Skills Checkpoint

### Copilot Quiz

> "Explain the for...of pattern we used for parameterised tests. Why is this better than copy-pasting tests?"

### Self-Assessment

1. When should you use parameterised tests vs individual tests?
2. Why do regression tests run only in staging?
3. How does test data separation improve maintainability?
4. What's the benefit of testing tier comparison explicitly?

---

## Common Mistakes & Fixes

### Mistake 1: Hardcoding Test Data in Tests

```typescript
// BAD - Data embedded in test
test('should show £9.99 price', async ({ page }) => {
  await expect(page.getByText('£9.99/month')).toBeVisible();
});

// GOOD - Data comes from shared source
test(`should show ${tier.monthlyPrice} price`, async ({ page }) => {
  await expect(page.getByText(tier.monthlyPrice)).toBeVisible();
});
```

### Mistake 2: Duplicate Tests for Each Variant

```typescript
// BAD - Repetitive
test('premium has feature A', ...);
test('premium has feature B', ...);
test('basic has feature A', ...);
test('basic has feature B', ...);

// GOOD - Parameterised
for (const tier of tiers) {
  for (const feature of tier.features) {
    test(`${tier.name} has ${feature}`, ...);
  }
}
```

### Mistake 3: Not Testing Relationships

```typescript
// BAD - Only testing presence
test('premium features visible', ...);
test('basic features visible', ...);

// GOOD - Testing relationships
test('premium should have more features than basic', async ({ page }) => {
  expect(premium.features.length).toBeGreaterThan(basic.features.length);
});
```

---

## Key Takeaways

1. **Smoke ≠ Regression**: Different purposes, different environments
2. **Parameterisation reduces duplication** and improves maintainability
3. **Test data should be centralized** for easy updates
4. **Test relationships, not just presence** (e.g., "more than", "different from")
5. **Edge cases matter** in regression (viewport, reload, etc.)

---

## Next Phase Preview

In **Phase 3**, you'll test the full new customer journey:
- Select subscription
- Enter customer details
- Navigate through the flow

**Homework:**
1. Add a new subscription tier to test data and see tests auto-run
2. Find an edge case we didn't cover
3. Think: What form fields will customers need to fill out?

---

**Phase 2 Complete!** You've built parameterised regression tests.
