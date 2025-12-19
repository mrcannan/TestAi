/**
 * Test Data: Subscription Tiers and Content
 *
 * This file centralizes all test data for the MailSubscriptions curriculum.
 * Update here when subscription offerings change.
 *
 * IMPORTANT: Keep this in sync with the actual website content.
 * Changes here affect all parameterised tests.
 */

// ============================================
// SUBSCRIPTION TIER DATA
// ============================================

export interface SubscriptionTier {
  /** Internal identifier */
  name: string;
  /** Display name on the website */
  displayName: string;
  /** Standard monthly price */
  monthlyPrice: string;
  /** Trial pricing text */
  trialPrice: string;
  /** Price after trial period */
  afterTrialPrice: string;
  /** List of features for this tier */
  features: string[];
  /** Optional promotional badge */
  badge?: string;
  /** Expected URL pattern for the CTA */
  ctaUrlPattern: RegExp;
}

export const subscriptionTiers: SubscriptionTier[] = [
  {
    name: 'premium',
    displayName: 'DailyMail+',
    monthlyPrice: '£9.99/month',
    trialPrice: 'First month free',
    afterTrialPrice: '£1.99/month for 11 months',
    badge: 'BEST VALUE',
    ctaUrlPattern: /themailsubscriptions\.co\.uk\/national\/buy/,
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
    ctaUrlPattern: /themailsubscriptions\.co\.uk\/national\/buy/,
    features: [
      'Unlimited access to the Daily Mail',
      'Over 850 exclusive articles per month',
      'Best of DailyMail+ weekly newsletter',
    ],
  },
];

// ============================================
// FAQ DATA
// ============================================

export interface FAQItem {
  question: string;
  answerContains: string;
}

export const faqItems: FAQItem[] = [
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

// ============================================
// MARKETING SECTION DATA
// ============================================

export interface MarketingSection {
  heading: string;
  hasImage: boolean;
  description?: string;
}

export const marketingSections: MarketingSection[] = [
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

// ============================================
// PAGE URLS
// ============================================

export const urls = {
  subscriptionPage: '/info/425365/choose-your-subscription',
  helpPage: '/help',
  termsPage: '/info/368160/subscriptions-general-terms-and-conditions',
};

// ============================================
// TEST CUSTOMER DATA (for E2E tests)
// ============================================

export interface TestCustomer {
  email: string;
  firstName: string;
  lastName: string;
  /** ISO country code */
  country: string;
}

/**
 * Generate a unique test customer email
 * Uses timestamp to ensure uniqueness
 */
export function generateTestCustomer(prefix = 'test'): TestCustomer {
  const timestamp = Date.now();
  return {
    email: `${prefix}+${timestamp}@testpilotai.com`,
    firstName: 'Test',
    lastName: 'Customer',
    country: 'GB',
  };
}

// ============================================
// PAYMENT TEST DATA
// ============================================

export const testCards = {
  /** Card that should succeed */
  valid: {
    number: '4242424242424242',
    expiry: '12/30',
    cvc: '123',
    name: 'Test Customer',
  },
  /** Card that should be declined */
  declined: {
    number: '4000000000000002',
    expiry: '12/30',
    cvc: '123',
    name: 'Test Customer',
  },
  /** Card that requires 3D Secure */
  threeDSecure: {
    number: '4000000000003220',
    expiry: '12/30',
    cvc: '123',
    name: 'Test Customer',
  },
};

// ============================================
// EXPECTED UI ELEMENTS
// ============================================

export const expectedElements = {
  subscriptionPage: {
    title: /Daily Mail/,
    mainHeading: 'Choose your subscription',
    faqHeading: 'Got any questions?',
    footerLinks: ['Help & FAQs', 'Privacy & Cookies Policy', 'Purchase Terms & Conditions'],
  },
  signInPage: {
    heading: 'Sign in or create an account',
    emailLabel: 'Enter email address',
    continueButton: 'Continue',
    socialProviders: ['Apple', 'Google', 'Microsoft', 'Facebook', 'X'],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get tier by name
 */
export function getTier(name: 'premium' | 'basic'): SubscriptionTier {
  const tier = subscriptionTiers.find((t) => t.name === name);
  if (!tier) throw new Error(`Tier "${name}" not found`);
  return tier;
}

/**
 * Get all tier names
 */
export function getTierNames(): string[] {
  return subscriptionTiers.map((t) => t.name);
}

/**
 * Get features unique to premium tier
 */
export function getPremiumExclusiveFeatures(): string[] {
  const premium = getTier('premium');
  const basic = getTier('basic');
  return premium.features.filter((f) => !basic.features.includes(f));
}
