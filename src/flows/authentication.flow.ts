import { Page } from '@playwright/test';
import { SignInPage } from '../pages/signin-page';

/**
 * Authentication Flow
 *
 * Handles user authentication/registration for subscription purchase.
 *
 * USE CASES:
 * - Tests: E2E authentication validation
 * - Tools: MCP sign-in health check
 * - Automation: Registration flow validation
 */

export interface AuthenticationResult {
  success: boolean;
  authMethod: 'email' | 'social' | null;
  socialProvider?: string;
  pageState: 'signin' | 'password' | 'verification' | 'complete' | 'error';
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
   *
   * @param email - Email address to use
   * @returns Structured authentication result
   */
  async authenticateWithEmail(email: string): Promise<AuthenticationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let pageState: AuthenticationResult['pageState'] = 'signin';

    try {
      // Wait for sign-in page
      await this.signInPage.waitForReady();

      // Enter email and continue
      await this.signInPage.submitEmail(email);

      // Determine what page we're on after submission
      await this.page.waitForTimeout(2000);

      const url = this.page.url();
      if (url.includes('password')) {
        pageState = 'password';
      } else if (url.includes('verify') || url.includes('confirmation')) {
        pageState = 'verification';
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
   *
   * @returns Validation result with details
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

    // Check footer
    try {
      await this.signInPage.verifyFooterLinks();
    } catch {
      issues.push('Footer links missing');
    }

    return {
      isValid: issues.length === 0,
      issues,
      socialProvidersAvailable: socialProviders,
    };
  }

  /**
   * Quick health check for sign-in page
   */
  async quickHealthCheck(): Promise<{
    healthy: boolean;
    responseTimeMs: number;
    emailInputAvailable: boolean;
    continueButtonAvailable: boolean;
  }> {
    const startTime = Date.now();

    try {
      await this.signInPage.waitForReady();

      const emailVisible = await this.signInPage.emailInput.isVisible();
      const continueVisible = await this.signInPage.continueButton.isVisible();

      return {
        healthy: emailVisible && continueVisible,
        responseTimeMs: Date.now() - startTime,
        emailInputAvailable: emailVisible,
        continueButtonAvailable: continueVisible,
      };
    } catch {
      return {
        healthy: false,
        responseTimeMs: Date.now() - startTime,
        emailInputAvailable: false,
        continueButtonAvailable: false,
      };
    }
  }
}
