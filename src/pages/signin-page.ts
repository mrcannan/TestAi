import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object: Sign In / Register Page
 *
 * URL: Various (redirected from subscription selection)
 * HOST: mymailaccount.co.uk
 * PURPOSE: Customer authentication for subscription purchase
 *
 * BUSINESS CONTEXT:
 * This is the authentication gate. New customers create accounts here,
 * existing customers sign in. Both paths must work for conversions.
 */
export class SignInPage {
  readonly page: Page;

  // Primary content
  readonly pageHeading: Locator;
  readonly subheading: Locator;

  // Email form
  readonly emailInput: Locator;
  readonly continueButton: Locator;

  // Social sign-in options
  readonly socialDivider: Locator;
  readonly appleSignIn: Locator;
  readonly googleSignIn: Locator;
  readonly microsoftSignIn: Locator;
  readonly facebookSignIn: Locator;
  readonly xSignIn: Locator;
  readonly microsoftContinueButton: Locator;

  // Footer
  readonly privacyPolicyLink: Locator;
  readonly termsOfServiceLink: Locator;

  // reCAPTCHA notice
  readonly recaptchaNotice: Locator;

  constructor(page: Page) {
    this.page = page;

    // Primary content
    this.pageHeading = page.getByRole('heading', { name: /Sign in or create an account/i });
    this.subheading = page.getByText(/Begin by entering your email/i);

    // Email form
    this.emailInput = page.getByRole('textbox', { name: /email address/i });
    this.continueButton = page.getByRole('button', { name: 'Continue' });

    // Social sign-in - multiple ways to locate due to dynamic rendering
    this.socialDivider = page.getByText('or use');
    this.appleSignIn = page.locator('[aria-label="Apple"], text=Apple').first();
    this.googleSignIn = page.locator('[aria-label="Google"], text=Google').first();
    this.microsoftSignIn = page.locator('[aria-label="Microsoft"], text=Microsoft').first();
    this.facebookSignIn = page.locator('[aria-label="Facebook"], text=Facebook').first();
    this.xSignIn = page.locator('[aria-label="X"], text=X').first();
    this.microsoftContinueButton = page.getByRole('button', { name: /Continue with Microsoft/i });

    // Footer
    this.privacyPolicyLink = page.getByRole('link', { name: 'Privacy Policy' });
    this.termsOfServiceLink = page.getByRole('link', { name: 'Terms of Service' });

    // reCAPTCHA
    this.recaptchaNotice = page.getByText(/protected by reCAPTCHA/i);
  }

  // ========================================
  // WAIT AND NAVIGATION
  // ========================================

  /**
   * Wait for sign-in page to be ready
   * Called after navigation from subscription selection
   */
  async waitForReady(): Promise<void> {
    // Wait for page heading with extended timeout (redirects can be slow)
    await expect(this.pageHeading).toBeVisible({ timeout: 15000 });
    await expect(this.emailInput).toBeVisible({ timeout: 5000 });
  }

  /**
   * Check if we're on the sign-in page
   */
  async isOnSignInPage(): Promise<boolean> {
    try {
      await expect(this.pageHeading).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  // ========================================
  // EMAIL AUTHENTICATION
  // ========================================

  /**
   * Enter email address in the input field
   */
  async enterEmail(email: string): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await this.emailInput.clear();
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
   * Combined action for convenience
   */
  async submitEmail(email: string): Promise<void> {
    await this.enterEmail(email);
    await this.clickContinue();
  }

  /**
   * Get current email value
   */
  async getEmailValue(): Promise<string> {
    return await this.emailInput.inputValue();
  }

  // ========================================
  // SOCIAL SIGN-IN
  // ========================================

  /**
   * Verify all social sign-in options are available
   */
  async verifySocialSignInOptions(): Promise<void> {
    // Wait for social options to load (they may be dynamically rendered)
    await expect(this.socialDivider).toBeVisible({ timeout: 10000 });

    // Check each provider is visible
    await expect(this.appleSignIn).toBeVisible();
    await expect(this.googleSignIn).toBeVisible();
    await expect(this.microsoftSignIn).toBeVisible();
    await expect(this.facebookSignIn).toBeVisible();
  }

  /**
   * Click Apple sign-in
   * Note: Will open Apple auth popup
   */
  async clickAppleSignIn(): Promise<void> {
    await expect(this.appleSignIn).toBeVisible();
    await this.appleSignIn.click();
  }

  /**
   * Click Google sign-in
   * Note: Will open Google auth popup
   */
  async clickGoogleSignIn(): Promise<void> {
    await expect(this.googleSignIn).toBeVisible();
    await this.googleSignIn.click();
  }

  /**
   * Click Microsoft sign-in
   * Note: Will open Microsoft auth popup
   */
  async clickMicrosoftSignIn(): Promise<void> {
    await expect(this.microsoftSignIn).toBeVisible();
    await this.microsoftSignIn.click();
  }

  // ========================================
  // VERIFICATION METHODS
  // ========================================

  /**
   * Verify the sign-in form is displayed correctly
   */
  async verifyFormDisplayed(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
    await expect(this.subheading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.continueButton).toBeVisible();
  }

  /**
   * Verify reCAPTCHA protection notice is shown
   */
  async verifyRecaptchaNotice(): Promise<void> {
    await expect(this.recaptchaNotice).toBeVisible();
  }

  /**
   * Verify footer links are present
   */
  async verifyFooterLinks(): Promise<void> {
    await expect(this.privacyPolicyLink).toBeVisible();
    await expect(this.termsOfServiceLink).toBeVisible();
  }

  // ========================================
  // ERROR HANDLING
  // ========================================

  /**
   * Check if there's a validation error visible
   */
  async hasValidationError(): Promise<boolean> {
    // Common error patterns
    const errorPatterns = [
      this.page.getByText(/invalid email/i),
      this.page.getByText(/please enter/i),
      this.page.getByText(/required/i),
      this.page.locator('[class*="error"]'),
    ];

    for (const pattern of errorPatterns) {
      try {
        if (await pattern.isVisible({ timeout: 1000 })) {
          return true;
        }
      } catch {
        // Pattern not found, continue
      }
    }

    return false;
  }

  /**
   * Get the current URL
   */
  getUrl(): string {
    return this.page.url();
  }
}
