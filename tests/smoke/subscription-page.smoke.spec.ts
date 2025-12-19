import { test, expect } from '@playwright/test';

/**
 * Smoke Test: Subscription Page
 *
 * BUSINESS RISK: If this page breaks, no new subscriptions happen.
 * This is the entry point for all subscription revenue.
 *
 * TEST TYPE: Smoke (production-safe, read-only)
 * ENVIRONMENT: Any (including production)
 *
 * URL: https://www.mailsubscriptions.co.uk/info/425365/choose-your-subscription
 */

test.describe('Subscription Page - Smoke Tests', () => {
  // Navigate to subscription page before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/info/425365/choose-your-subscription');

    // Handle cookie consent if it appears
    const cookieAcceptButton = page.getByRole('button', { name: 'Got it' });
    if (await cookieAcceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieAcceptButton.click();
      await expect(cookieAcceptButton).not.toBeVisible({ timeout: 3000 });
    }
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

    // Look for the premium subscription card with "BEST VALUE" badge
    await expect(page.getByText('BEST VALUE')).toBeVisible();

    // Verify DailyMail+ branding
    const premiumOption = page.locator('strong', { hasText: 'DailyMail+' }).first();
    await expect(premiumOption).toBeVisible();

    // Verify pricing structure is displayed
    await expect(page.getByText('£9.99/month')).toBeVisible();
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

    // Find the subscription links (both options have "First month free")
    const subscriptionLinks = page.getByRole('link', { name: /First month free/i });

    // Verify at least 2 subscription options have CTAs
    await expect(subscriptionLinks).toHaveCount(2);

    // Verify CTAs are visible and enabled
    for (const link of await subscriptionLinks.all()) {
      await expect(link).toBeVisible();
      await expect(link).toBeEnabled();
    }
  });

  test('should display subscription benefits for premium tier', async ({ page }) => {
    // WHAT: Verify key premium benefits are listed
    // WHY: Benefits drive conversion decisions for premium
    // BUSINESS RISK: Missing benefits = lower premium conversion rate

    const premiumBenefits = [
      'Unlimited access to the Daily Mail',
      '850 exclusive articles',
      'weekly newsletter',
      '80% fewer ads',
      'premium puzzles',
    ];

    for (const benefit of premiumBenefits) {
      await expect(
        page.getByText(benefit, { exact: false }),
        `Benefit "${benefit}" should be visible`
      ).toBeVisible();
    }
  });

  test('should display promotional pricing', async ({ page }) => {
    // WHAT: Verify trial/promotional offer is visible
    // WHY: Promotional pricing is a key conversion driver
    // BUSINESS RISK: Hidden promo = lower conversion rate

    // Both tiers have "First month free" offer
    await expect(page.getByText('First month free').first()).toBeVisible();

    // Verify the introductory price is shown
    await expect(page.getByText('£1.99/month', { exact: false }).first()).toBeVisible();
  });

  test('should display FAQ section', async ({ page }) => {
    // WHAT: Verify FAQ section helps customers make informed decisions
    // WHY: FAQs reduce support burden and increase confidence
    // BUSINESS RISK: Missing FAQs = higher bounce rate

    await expect(page.getByText('Got any questions?')).toBeVisible();
    await expect(page.getByText('What is DailyMail+?')).toBeVisible();
  });

  test('should display footer with legal links', async ({ page }) => {
    // WHAT: Verify legal and support links are present
    // WHY: Legal compliance and customer support access
    // BUSINESS RISK: Missing legal links = compliance issues

    await expect(page.getByRole('link', { name: 'Help & FAQs' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy & Cookies Policy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Purchase Terms & Conditions' })).toBeVisible();
  });
});
