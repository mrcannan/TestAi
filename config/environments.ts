/**
 * Environment Configuration
 *
 * Controls test behavior based on target environment.
 * CRITICAL: Production tests must be read-only.
 */

export type Environment = 'staging' | 'production';

export interface EnvironmentConfig {
  /** Environment name */
  name: Environment;
  /** Base URL for the environment */
  baseUrl: string;
  /** Whether write operations are allowed */
  allowWriteOperations: boolean;
  /** Whether test data creation is allowed */
  allowDataCreation: boolean;
  /** Whether form submission is allowed */
  allowFormSubmission: boolean;
  /** Maximum test timeout in milliseconds */
  maxTestTimeout: number;
  /** Number of retries for failed tests */
  retries: number;
}

/**
 * Environment configurations
 */
export const environments: Record<Environment, EnvironmentConfig> = {
  staging: {
    name: 'staging',
    baseUrl: 'https://www.mailsubscriptions.co.uk', // Use same URL for curriculum
    allowWriteOperations: true,
    allowDataCreation: true,
    allowFormSubmission: true,
    maxTestTimeout: 60000,
    retries: 2,
  },
  production: {
    name: 'production',
    baseUrl: 'https://www.mailsubscriptions.co.uk',
    allowWriteOperations: false,
    allowDataCreation: false,
    allowFormSubmission: false,
    maxTestTimeout: 30000,
    retries: 1,
  },
};

/**
 * Get current environment from ENV variable
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.ENVIRONMENT || 'staging';
  if (env !== 'staging' && env !== 'production') {
    console.warn(`Unknown environment "${env}", defaulting to staging`);
    return 'staging';
  }
  return env;
}

/**
 * Get environment config for current environment
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  return environments[getCurrentEnvironment()];
}

/**
 * Safety check: Is this action allowed in current environment?
 */
export function isActionAllowed(action: 'write' | 'create' | 'submit'): boolean {
  const config = getEnvironmentConfig();
  switch (action) {
    case 'write':
      return config.allowWriteOperations;
    case 'create':
      return config.allowDataCreation;
    case 'submit':
      return config.allowFormSubmission;
  }
}

/**
 * Assert action is allowed, throw if not
 * Use as a guard before performing sensitive operations
 */
export function assertActionAllowed(action: 'write' | 'create' | 'submit'): void {
  if (!isActionAllowed(action)) {
    const env = getCurrentEnvironment();
    throw new Error(
      `SAFETY BLOCK: Action "${action}" is not allowed in ${env} environment`
    );
  }
}

/**
 * Check if currently in production environment
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === 'production';
}

/**
 * Check if currently in staging environment
 */
export function isStaging(): boolean {
  return getCurrentEnvironment() === 'staging';
}
