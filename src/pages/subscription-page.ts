import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object: Subscription Selection Page
 *
 * URL: /info/425365/choose-your-subscription
 * PURPOSE: Entry point for new subscriptions - where customers choose their plan
 *
 * BUSINESS CONTEXT:
 * This is the top of the conversion funnel. Any issues here directly impact
 * new subscription revenue.
 */
export class SubscriptionPage {
  readonly page: Page;

  // Primary content locators
  readonly pageHeading: Locator;
  readonly premiumCTA: Locator;
  readonly basicCTA: Locator;

  // Subscription tier locators
  readonly bestValueBadge: Locator;
  readonly premiumTierName: Locator;
  readonly basicTierName: Locator;
  readonly premiumPrice: Locator;
  readonly basicPrice: Locator;

  // Cookie consent
  readonly cookieAcceptButton: Locator;

  // FAQ section
  readonly faqSection: Locator;

  // Footer
  readonly helpLink: Locator;
  readonly privacyLink: Locator;
  readonly termsLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Primary content
    this.pageHeading = page.getByText('Choose your subscription');
    this.premiumCTA = page.getByRole('link', { name: /First month free/i }).first();
    this.basicCTA = page.getByRole('link', { name: /First month free/i }).last();

    // Subscription tiers
    this.bestValueBadge = page.getByText('BEST VALUE');
    this.premiumTierName = page.locator('strong', { hasText: 'DailyMail+' }).first();
    this.basicTierName = page.getByText('DailyMail+ Basic');
    this.premiumPrice = page.getByText('£9.99/month');
    this.basicPrice = page.getByText('£6.99/month');

    // Cookie consent
    this.cookieAcceptButton = page.getByRole('button', { name: 'Got it' });

    // FAQ
    this.faqSection = page.getByText('Got any questions?');

    // Footer links
    this.helpLink = page.getByRole('link', { name: 'Help & FAQs' });
    this.privacyLink = page.getByRole('link', { name: 'Privacy & Cookies Policy' });
    this.termsLink = page.getByRole('link', { name: 'Purchase Terms & Conditions' });
  }

  // ========================================
  // NAVIGATION
  // ========================================

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
   * This is required before interacting with page content
   */
  async handleCookieConsent(): Promise<void> {
    try {
      if (await this.cookieAcceptButton.isVisible({ timeout: 3000 })) {
        await this.cookieAcceptButton.click();
        await expect(this.cookieAcceptButton).not.toBeVisible({ timeout: 3000 });
      }
    } catch {
      // Cookie banner not present, continue
    }
  }

  // ========================================
  // SUBSCRIPTION SELECTION
  // ========================================

  /**
   * Select the premium (DailyMail+) subscription
   * Navigates to sign-in page
   */
  async selectPremiumSubscription(): Promise<void> {
    await expect(this.premiumCTA).toBeVisible();
    await expect(this.premiumCTA).toBeEnabled();
    await this.premiumCTA.click();

    // Wait for navigation to sign-in page
    await this.page.waitForURL(/signinOrRegister|mymailaccount/, { timeout: 15000 });
  }

  /**
   * Select the basic (DailyMail+ Basic) subscription
   * Navigates to sign-in page
   */
  async selectBasicSubscription(): Promise<void> {
    await expect(this.basicCTA).toBeVisible();
    await expect(this.basicCTA).toBeEnabled();
    await this.basicCTA.click();

    await this.page.waitForURL(/signinOrRegister|mymailaccount/, { timeout: 15000 });
  }

  // ========================================
  // VERIFICATION METHODS
  // ========================================

  /**
   * Verify premium tier is displayed correctly
   */
  async verifyPremiumTierDisplayed(): Promise<void> {
    await expect(this.bestValueBadge).toBeVisible();
    await expect(this.premiumTierName).toBeVisible();
    await expect(this.premiumPrice).toBeVisible();
  }

  /**
   * Verify basic tier is displayed correctly
   */
  async verifyBasicTierDisplayed(): Promise<void> {
    await expect(this.basicTierName).toBeVisible();
    await expect(this.basicPrice).toBeVisible();
  }

  /**
   * Verify both subscription tiers are visible
   */
  async verifyAllTiersDisplayed(): Promise<void> {
    await this.verifyPremiumTierDisplayed();
    await this.verifyBasicTierDisplayed();
  }

  /**
   * Verify FAQ section is present
   */
  async verifyFAQSection(): Promise<void> {
    await expect(this.faqSection).toBeVisible();
  }

  /**
   * Verify footer links are present
   */
  async verifyFooterLinks(): Promise<void> {
    await expect(this.helpLink).toBeVisible();
    await expect(this.privacyLink).toBeVisible();
    await expect(this.termsLink).toBeVisible();
  }

  // ========================================
  // STATE CHECKS
  // ========================================

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

  /**
   * Get the current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Get subscription CTA links for verification
   */
  async getSubscriptionLinks(): Promise<string[]> {
    const links = await this.page.getByRole('link', { name: /First month free/i }).all();
    const hrefs: string[] = [];

    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) hrefs.push(href);
    }

    return hrefs;
  }
}
