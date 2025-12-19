import { Page, Locator, expect } from '@playwright/test';
import { getEnvironmentConfig, assertActionAllowed } from '../../config/environments';

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
  // Common patterns for UK payment providers (Stripe, Adyen, Worldpay)
  readonly cardNumberInput: Locator;
  readonly expiryInput: Locator;
  readonly cvcInput: Locator;
  readonly nameOnCardInput: Locator;
  readonly submitButton: Locator;

  // Order summary elements
  readonly orderTotal: Locator;
  readonly subscriptionSummary: Locator;

  // Error messages
  readonly errorMessage: Locator;
  readonly cardDeclinedMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Card input fields - common patterns
    this.cardNumberInput = page.locator(
      '[name*="cardnumber"], [name*="card-number"], [data-testid*="card-number"]'
    );
    this.expiryInput = page.locator(
      '[name*="exp"], [name*="expiry"], [data-testid*="expiry"]'
    );
    this.cvcInput = page.locator(
      '[name*="cvc"], [name*="cvv"], [data-testid*="cvc"]'
    );
    this.nameOnCardInput = page.locator(
      '[name*="name"], [placeholder*="name on card"]'
    );

    // Submit button - various UK labels
    this.submitButton = page.getByRole('button', {
      name: /pay|subscribe|complete.*order|confirm.*payment/i,
    });

    // Order summary
    this.orderTotal = page.locator('[class*="total"], [data-testid*="total"]');
    this.subscriptionSummary = page.locator('[class*="summary"], [class*="order"]');

    // Error messages
    this.errorMessage = page.locator('[class*="error"], [role="alert"]');
    this.cardDeclinedMessage = page.getByText(/declined|rejected|failed/i);
  }

  /**
   * Wait for payment form to be ready
   * Handles iFrame-embedded payment forms (common with Stripe)
   */
  async waitForReady(): Promise<void> {
    // Check for common payment form indicators
    const paymentIndicators = [
      this.page.getByText(/card number/i),
      this.page.getByText(/payment details/i),
      this.page.locator('iframe[name*="card"], iframe[name*="payment"]'),
    ];

    // Wait for at least one indicator
    for (const indicator of paymentIndicators) {
      try {
        await indicator.waitFor({ state: 'visible', timeout: 5000 });
        return;
      } catch {
        continue;
      }
    }

    throw new Error('Payment form did not load within expected time');
  }

  /**
   * Fill payment form with test card data
   *
   * WARNING: Only use in staging with test cards!
   * UK test card numbers for Stripe:
   * - Success: 4242 4242 4242 4242
   * - Decline: 4000 0000 0000 0002
   * - 3D Secure: 4000 0000 0000 3220
   */
  async fillPaymentForm(cardData: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
  }): Promise<void> {
    // Safety check - verify we're not in production
    assertActionAllowed('submit');

    const url = this.page.url();
    if (url.includes('production') || this.isLikelyProduction(url)) {
      throw new Error('SAFETY: Payment form fill blocked - production environment detected');
    }

    // Fill form fields
    // Note: Stripe uses iframes - this handles direct forms
    if (await this.cardNumberInput.isVisible().catch(() => false)) {
      await this.cardNumberInput.fill(cardData.number);
      await this.expiryInput.fill(cardData.expiry);
      await this.cvcInput.fill(cardData.cvc);
      if (await this.nameOnCardInput.isVisible().catch(() => false)) {
        await this.nameOnCardInput.fill(cardData.name);
      }
    } else {
      // Handle Stripe iframe
      await this.fillStripeFrame(cardData);
    }
  }

  /**
   * Handle Stripe-style iFrame payment form
   */
  private async fillStripeFrame(cardData: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
  }): Promise<void> {
    // Stripe embeds inputs in iframes
    const cardFrame = this.page.frameLocator('iframe[name*="card"], iframe[title*="card"]');

    await cardFrame.locator('input[name="cardnumber"]').fill(cardData.number);
    await cardFrame.locator('input[name="exp-date"]').fill(cardData.expiry);
    await cardFrame.locator('input[name="cvc"]').fill(cardData.cvc);
  }

  /**
   * Submit payment form
   *
   * CRITICAL: This triggers actual payment - staging only!
   */
  async submitPayment(): Promise<void> {
    assertActionAllowed('submit');

    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();

    // Wait for processing
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify payment form is displayed
   * Used for smoke tests - doesn't interact with form
   */
  async verifyPaymentFormDisplayed(): Promise<void> {
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
   * Get displayed order total
   */
  async getOrderTotal(): Promise<string | null> {
    try {
      // Look for GBP currency patterns
      const priceElement = this.page.locator('text=/£[0-9]+\\.[0-9]{2}/');
      if (await priceElement.isVisible()) {
        return await priceElement.textContent();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if payment succeeded
   */
  async isPaymentSuccessful(): Promise<boolean> {
    const successIndicators = [
      /thank you/i,
      /payment.*successful/i,
      /order.*confirmed/i,
      /subscription.*activated/i,
    ];

    for (const pattern of successIndicators) {
      if (await this.page.getByText(pattern).isVisible().catch(() => false)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if payment was declined
   */
  async isPaymentDeclined(): Promise<boolean> {
    return await this.cardDeclinedMessage.isVisible().catch(() => false);
  }

  /**
   * Get any error message displayed
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible().catch(() => false)) {
      return await this.errorMessage.textContent();
    }
    return null;
  }

  /**
   * Check if we're on a payment page
   */
  async isOnPaymentPage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('payment') || url.includes('checkout') || url.includes('pay');
  }

  /**
   * Simple heuristic to detect production URLs
   */
  private isLikelyProduction(url: string): boolean {
    const prodIndicators = ['www.', 'prod.', 'live.'];
    const stagingIndicators = ['staging.', 'test.', 'dev.', 'sandbox.', 'localhost'];

    // If it has staging indicators, it's not production
    for (const indicator of stagingIndicators) {
      if (url.includes(indicator)) {
        return false;
      }
    }

    // If it has prod indicators and no staging ones, likely production
    for (const indicator of prodIndicators) {
      if (url.includes(indicator)) {
        return true;
      }
    }

    // When in doubt, treat as production (safer)
    return !getEnvironmentConfig().allowFormSubmission;
  }
}
