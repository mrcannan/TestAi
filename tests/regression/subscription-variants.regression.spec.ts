import { test, expect } from '@playwright/test';
import {
  subscriptionTiers,
  faqItems,
  marketingSections,
  type SubscriptionTier,
} from '../../src/utils/test-data';

/**
 * Regression Test: Subscription Variants
 *
 * BUSINESS RISK: Incorrect pricing or features = customer confusion and support load
 * TEST TYPE: Regression (staging only, comprehensive coverage)
 * ENVIRONMENT: Staging only - these tests are more comprehensive than smoke tests
 *
 * This test pack validates all subscription variants systematically using
 * parameterised tests to avoid code duplication.
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
        // WHY: Each tier must be discoverable by customers
        // BUSINESS RISK: Hidden tier = lost revenue from that segment
        await expect(page.getByText(tier.displayName)).toBeVisible();
      });

      test(`should display correct pricing for ${tier.displayName}`, async ({ page }) => {
        // WHAT: Verify pricing matches expected values
        // WHY: Incorrect pricing = legal issues and customer trust problems
        // BUSINESS RISK: Wrong price displayed = refunds, complaints, legal exposure
        await expect(page.getByText(tier.monthlyPrice)).toBeVisible();
        await expect(page.getByText(tier.trialPrice, { exact: false }).first()).toBeVisible();
      });

      if (tier.badge) {
        test(`should display "${tier.badge}" badge for ${tier.displayName}`, async ({ page }) => {
          // WHAT: Verify promotional badge is visible
          // WHY: Badges guide customer decision-making
          // BUSINESS RISK: Missing badge = lower premium conversion
          await expect(page.getByText(tier.badge)).toBeVisible();
        });
      }

      test(`should display all features for ${tier.displayName}`, async ({ page }) => {
        // WHAT: Verify all tier features are listed
        // WHY: Features differentiate tiers and drive purchase decisions
        // BUSINESS RISK: Missing features = unclear value proposition
        for (const feature of tier.features) {
          await expect(
            page.getByText(feature, { exact: false }),
            `Feature "${feature}" should be visible for ${tier.displayName}`
          ).toBeVisible();
        }
      });

      test(`should have working CTA link for ${tier.displayName}`, async ({ page }) => {
        // WHAT: Verify CTA has valid href
        // WHY: Broken CTA = conversion failure
        // BUSINESS RISK: Invalid link = 100% drop-off at this point
        // NOTE: We don't click in regression tests - that's for E2E

        const subscriptionLinks = page.getByRole('link', { name: /First month free/i });
        const links = await subscriptionLinks.all();

        // Verify we have links and they point to correct destination
        expect(links.length).toBeGreaterThanOrEqual(2);

        for (const link of links) {
          const href = await link.getAttribute('href');
          expect(href, 'CTA should have href attribute').toBeTruthy();
          expect(href).toMatch(tier.ctaUrlPattern);
        }
      });

      test(`should display post-trial pricing for ${tier.displayName}`, async ({ page }) => {
        // WHAT: Verify customers see what they'll pay after trial
        // WHY: Transparency builds trust and reduces churn
        // BUSINESS RISK: Hidden post-trial pricing = chargebacks and complaints
        await expect(page.getByText(tier.afterTrialPrice, { exact: false })).toBeVisible();
      });
    });
  }

  // ========================================
  // PARAMETERISED TESTS: FAQ Section
  // ========================================

  test.describe('FAQ Section', () => {
    test('should display FAQ section heading', async ({ page }) => {
      // WHAT: Verify FAQ section is present
      // WHY: FAQs reduce support burden and increase conversion confidence
      await expect(page.getByText('Got any questions?')).toBeVisible();
    });

    for (const faq of faqItems) {
      test(`should display FAQ: "${faq.question}"`, async ({ page }) => {
        // WHAT: Verify FAQ question and answer are present
        // WHY: Each FAQ addresses a common customer concern
        // BUSINESS RISK: Missing FAQ = higher support volume
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
      test(`should display marketing section: "${section.heading.substring(0, 40)}..."`, async ({
        page,
      }) => {
        // WHAT: Verify marketing content is present
        // WHY: Marketing content drives conversion by showing value
        // BUSINESS RISK: Missing marketing = lower conversion rate
        const heading = page.getByRole('heading', { name: section.heading, exact: false });
        await expect(heading).toBeVisible();

        if (section.hasImage) {
          // Find image within the section
          const sectionContainer = heading.locator('..').locator('..');
          await expect(sectionContainer.getByRole('img').first()).toBeVisible();
        }
      });
    }
  });

  // ========================================
  // COMPARISON TESTS
  // ========================================

  test.describe('Tier Comparison', () => {
    test('should display all subscription tiers on the same page', async ({ page }) => {
      // WHAT: Verify all tiers are simultaneously visible
      // WHY: Customers need to compare options side-by-side
      // BUSINESS RISK: Missing tier = customers can't make informed choice
      for (const tier of subscriptionTiers) {
        await expect(
          page.getByText(tier.displayName),
          `${tier.displayName} should be visible`
        ).toBeVisible();
      }
    });

    test('should clearly differentiate pricing between tiers', async ({ page }) => {
      // WHAT: Verify price differentiation is visible
      // WHY: Price is a key decision factor
      // BUSINESS RISK: Unclear pricing = customer confusion
      const premiumTier = subscriptionTiers.find((t) => t.name === 'premium')!;
      const basicTier = subscriptionTiers.find((t) => t.name === 'basic')!;

      await expect(page.getByText(premiumTier.monthlyPrice)).toBeVisible();
      await expect(page.getByText(basicTier.monthlyPrice)).toBeVisible();

      // Verify prices are different (data validation)
      expect(premiumTier.monthlyPrice).not.toBe(basicTier.monthlyPrice);
    });

    test('premium tier should have more features than basic tier', async ({ page }) => {
      // WHAT: Verify premium tier value proposition
      // WHY: Premium must justify higher price
      // BUSINESS RISK: No clear premium benefit = lower premium adoption
      const premium = subscriptionTiers.find((t) => t.name === 'premium')!;
      const basic = subscriptionTiers.find((t) => t.name === 'basic')!;

      expect(
        premium.features.length,
        'Premium should have more features than Basic'
      ).toBeGreaterThan(basic.features.length);

      // Calculate premium-exclusive features
      const premiumExclusiveFeatures = premium.features.filter(
        (f) => !basic.features.includes(f)
      );

      expect(
        premiumExclusiveFeatures.length,
        'Premium should have exclusive features'
      ).toBeGreaterThan(0);

      // Verify premium-exclusive features are visible
      for (const feature of premiumExclusiveFeatures) {
        await expect(
          page.getByText(feature, { exact: false }),
          `Premium-exclusive feature "${feature}" should be visible`
        ).toBeVisible();
      }
    });
  });

  // ========================================
  // RESPONSIVE DESIGN TESTS
  // ========================================

  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'wide', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`should display correctly at ${viewport.name} size (${viewport.width}x${viewport.height})`, async ({
        page,
      }) => {
        // WHAT: Verify responsive design works
        // WHY: Users access from various devices
        // BUSINESS RISK: Broken mobile = lost mobile conversions
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Core elements should be visible at all sizes
        await expect(page.getByText('Choose your subscription')).toBeVisible();

        // Both tier options should be visible
        for (const tier of subscriptionTiers) {
          await expect(
            page.getByText(tier.displayName),
            `${tier.displayName} should be visible at ${viewport.name} size`
          ).toBeVisible();
        }
      });
    }
  });

  // ========================================
  // EDGE CASE TESTS
  // ========================================

  test.describe('Edge Cases', () => {
    test('should handle page reload gracefully', async ({ page }) => {
      // WHAT: Verify page state after reload
      // WHY: Users may refresh while comparing options
      // BUSINESS RISK: Broken reload = frustrated customers
      await page.reload();

      // Handle cookie consent again if needed
      const cookieAcceptButton = page.getByRole('button', { name: 'Got it' });
      if (await cookieAcceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cookieAcceptButton.click();
      }

      await expect(page.getByText('Choose your subscription')).toBeVisible();

      // Verify content is still present after reload
      for (const tier of subscriptionTiers) {
        await expect(page.getByText(tier.displayName)).toBeVisible();
      }
    });

    test('should maintain state during scroll', async ({ page }) => {
      // WHAT: Verify content remains accessible during scroll
      // WHY: Users scroll to compare options
      // BUSINESS RISK: Scroll issues = content not accessible
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500); // Brief wait for any animations

      // Footer should be visible after scrolling
      await expect(page.getByRole('link', { name: 'Help & FAQs' })).toBeVisible();

      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);

      // Header content should be visible
      await expect(page.getByText('Choose your subscription')).toBeVisible();
    });
  });
});
