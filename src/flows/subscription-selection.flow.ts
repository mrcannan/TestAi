import { Page } from '@playwright/test';
import { SubscriptionPage } from '../pages/subscription-page';

/**
 * Subscription Selection Flow
 *
 * Orchestrates the subscription selection journey from landing
 * to authentication page.
 *
 * USE CASES:
 * - Tests: E2E journey validation
 * - Tools: MCP subscription health check
 * - Automation: Scheduled validation
 */

export interface SubscriptionSelectionResult {
  success: boolean;
  tier: 'premium' | 'basic' | null;
  pageReached: 'subscription' | 'signin' | 'error';
  errors: string[];
  durationMs: number;
}

export class SubscriptionSelectionFlow {
  private page: Page;
  private subscriptionPage: SubscriptionPage;

  constructor(page: Page) {
    this.page = page;
    this.subscriptionPage = new SubscriptionPage(page);
  }

  /**
   * Execute full subscription selection flow
   *
   * @param tier - Which subscription tier to select
   * @returns Structured result with status and timing
   */
  async execute(tier: 'premium' | 'basic' = 'premium'): Promise<SubscriptionSelectionResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let pageReached: SubscriptionSelectionResult['pageReached'] = 'error';

    try {
      // Step 1: Navigate to subscription page
      await this.subscriptionPage.goto();
      pageReached = 'subscription';

      // Step 2: Verify page loaded correctly
      if (!(await this.subscriptionPage.isLoaded())) {
        errors.push('Subscription page did not load correctly');
        return this.buildResult(false, null, pageReached, errors, startTime);
      }

      // Step 3: Select the appropriate tier
      if (tier === 'premium') {
        await this.subscriptionPage.selectPremiumSubscription();
      } else {
        await this.subscriptionPage.selectBasicSubscription();
      }

      // Step 4: Verify navigation to sign-in
      pageReached = 'signin';

      return this.buildResult(true, tier, pageReached, errors, startTime);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return this.buildResult(false, null, pageReached, errors, startTime);
    }
  }

  /**
   * Validate subscription page without navigation
   *
   * @returns Validation result
   */
  async validateSubscriptionPage(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      await this.subscriptionPage.goto();
    } catch (error) {
      issues.push(`Failed to load page: ${error instanceof Error ? error.message : String(error)}`);
      return { isValid: false, issues };
    }

    // Check premium tier
    try {
      await this.subscriptionPage.verifyPremiumTierDisplayed();
    } catch {
      issues.push('Premium tier not displayed correctly');
    }

    // Check basic tier
    try {
      await this.subscriptionPage.verifyBasicTierDisplayed();
    } catch {
      issues.push('Basic tier not displayed correctly');
    }

    // Check CTAs
    try {
      const links = await this.subscriptionPage.getSubscriptionLinks();
      if (links.length < 2) {
        issues.push('Missing subscription CTAs');
      }
    } catch {
      issues.push('Failed to retrieve subscription CTAs');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Quick health check - minimal validation
   */
  async quickHealthCheck(): Promise<{
    healthy: boolean;
    responseTimeMs: number;
  }> {
    const startTime = Date.now();

    try {
      await this.subscriptionPage.goto();
      const isLoaded = await this.subscriptionPage.isLoaded();

      return {
        healthy: isLoaded,
        responseTimeMs: Date.now() - startTime,
      };
    } catch {
      return {
        healthy: false,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  private buildResult(
    success: boolean,
    tier: 'premium' | 'basic' | null,
    pageReached: SubscriptionSelectionResult['pageReached'],
    errors: string[],
    startTime: number
  ): SubscriptionSelectionResult {
    return {
      success,
      tier,
      pageReached,
      errors,
      durationMs: Date.now() - startTime,
    };
  }
}
