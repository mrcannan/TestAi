# Phase 7: Playwright MCP - Turning Tests into Tools

**Duration**: ~4 hours
**Goal**: Introduce MCP (Model Context Protocol) using real subscription checks.

---

## Learning Objectives

By the end of this phase, you will:

1. Understand what MCP is and why it matters
2. Create your first Playwright MCP tool
3. Define tool schemas with structured outputs
4. Make automation callable by AI agents

---

## What is MCP?

**Model Context Protocol (MCP)** is a standard for connecting AI models to external tools and data sources.

```
┌─────────────┐     MCP Protocol      ┌─────────────────┐
│   AI Model  │ ◄──────────────────► │   MCP Server    │
│  (Claude)   │                       │  (Playwright)   │
└─────────────┘                       └─────────────────┘
                                              │
                                              ▼
                                      ┌─────────────────┐
                                      │   Browser       │
                                      │   Automation    │
                                      └─────────────────┘
```

### Why MCP + Playwright?

| Without MCP | With MCP |
|-------------|----------|
| AI describes automation | AI executes automation |
| "Here's how to test it" | "I tested it, here are results" |
| Manual test execution | AI-triggered test execution |
| Human interprets output | Structured results for AI |

---

## MCP Tool Design Principles

1. **Clear purpose** - One tool = one job
2. **Structured output** - JSON, not prose
3. **Deterministic** - Same input = same output
4. **Observable** - Return actionable data
5. **Safe** - Environment-aware guards

---

## Your First MCP Tool

### Tool: `validate_subscription_journey`

**Purpose**: Check if the subscription purchase journey is healthy.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "tier": {
      "type": "string",
      "enum": ["premium", "basic"],
      "description": "Which subscription tier to validate"
    },
    "fullJourney": {
      "type": "boolean",
      "description": "Whether to validate full journey or just landing page"
    }
  }
}
```

**Output Schema**:
```json
{
  "healthy": boolean,
  "timestamp": "ISO string",
  "stages": {
    "subscriptionPage": {
      "reachable": boolean,
      "tiersVisible": boolean,
      "ctasWorking": boolean
    },
    "signInPage": {
      "reachable": boolean,
      "formFunctional": boolean
    }
  },
  "errors": ["string"],
  "durationMs": number
}
```

---

## Implementation

Create `src/mcp-tools/validate-subscription-journey.ts`:

```typescript
import { chromium, Browser, Page } from '@playwright/test';
import { validateSubscriptionJourney, JourneyValidationResult } from '../utils/journey-validator';
import { getEnvironmentConfig } from '../../config/environments';

/**
 * MCP Tool: validate_subscription_journey
 *
 * Validates the subscription purchase journey health.
 *
 * USAGE:
 * - Called by AI agents to check journey health
 * - Returns structured JSON for AI interpretation
 * - Safe for production (read-only operations)
 */

export interface ValidateSubscriptionJourneyInput {
  tier?: 'premium' | 'basic';
  fullJourney?: boolean;
}

export interface ValidateSubscriptionJourneyOutput {
  healthy: boolean;
  timestamp: string;
  environment: string;
  tier: string;
  stages: {
    subscriptionPage: {
      reachable: boolean;
      premiumTierVisible: boolean;
      basicTierVisible: boolean;
      ctasWorking: boolean;
    };
    signInPage: {
      reachable: boolean;
      formFunctional: boolean;
      socialOptionsAvailable: boolean;
    };
  };
  errors: string[];
  durationMs: number;
  recommendation: string;
}

/**
 * Main tool function - called by MCP server
 */
export async function validateSubscriptionJourneyTool(
  input: ValidateSubscriptionJourneyInput = {}
): Promise<ValidateSubscriptionJourneyOutput> {
  const { tier = 'premium', fullJourney = true } = input;
  const envConfig = getEnvironmentConfig();

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Launch browser
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    page = await context.newPage();

    // Set base URL
    await page.goto(envConfig.baseUrl);

    // Run validation
    const result = await validateSubscriptionJourney(page);

    // Build structured output
    return {
      healthy: result.healthy,
      timestamp: result.timestamp,
      environment: envConfig.name,
      tier,
      stages: result.stages,
      errors: result.errors,
      durationMs: result.totalDurationMs,
      recommendation: generateRecommendation(result),
    };
  } catch (error) {
    return {
      healthy: false,
      timestamp: new Date().toISOString(),
      environment: envConfig.name,
      tier,
      stages: {
        subscriptionPage: {
          reachable: false,
          premiumTierVisible: false,
          basicTierVisible: false,
          ctasWorking: false,
        },
        signInPage: {
          reachable: false,
          formFunctional: false,
          socialOptionsAvailable: false,
        },
      },
      errors: [error instanceof Error ? error.message : String(error)],
      durationMs: 0,
      recommendation: 'CRITICAL: Tool execution failed. Check browser setup.',
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate human-readable recommendation based on results
 */
function generateRecommendation(result: JourneyValidationResult): string {
  if (result.healthy) {
    return 'Journey is healthy. No action required.';
  }

  const issues: string[] = [];

  if (!result.stages.subscriptionPage.reachable) {
    issues.push('Subscription page is unreachable - check server status');
  }
  if (!result.stages.subscriptionPage.premiumTierVisible) {
    issues.push('Premium tier not visible - check page content');
  }
  if (!result.stages.subscriptionPage.ctasWorking) {
    issues.push('CTAs not working - check navigation');
  }
  if (!result.stages.signInPage.reachable) {
    issues.push('Sign-in page unreachable - check authentication flow');
  }

  return `Issues found: ${issues.join('; ')}`;
}

/**
 * Tool metadata for MCP registration
 */
export const toolMetadata = {
  name: 'validate_subscription_journey',
  description:
    'Validates the subscription purchase journey by navigating through the flow and checking each stage.',
  inputSchema: {
    type: 'object',
    properties: {
      tier: {
        type: 'string',
        enum: ['premium', 'basic'],
        description: 'Which subscription tier to validate',
        default: 'premium',
      },
      fullJourney: {
        type: 'boolean',
        description: 'Whether to validate full journey (including sign-in) or just landing page',
        default: true,
      },
    },
  },
};
```

---

## MCP Server Setup

Create `src/mcp-tools/server.ts`:

```typescript
/**
 * Playwright MCP Server
 *
 * Exposes Playwright automation as MCP tools for AI agents.
 */

import { validateSubscriptionJourneyTool, toolMetadata } from './validate-subscription-journey';

// Tool registry
const tools = {
  validate_subscription_journey: {
    metadata: toolMetadata,
    execute: validateSubscriptionJourneyTool,
  },
};

/**
 * Handle MCP tool request
 */
export async function handleToolRequest(
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const tool = tools[toolName as keyof typeof tools];

  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  return await tool.execute(input);
}

/**
 * List available tools (for MCP discovery)
 */
export function listTools(): Array<{ name: string; description: string; inputSchema: object }> {
  return Object.values(tools).map((tool) => ({
    name: tool.metadata.name,
    description: tool.metadata.description,
    inputSchema: tool.metadata.inputSchema,
  }));
}

// Example CLI usage
if (require.main === module) {
  (async () => {
    console.log('Available tools:', listTools());

    console.log('\nRunning validate_subscription_journey...');
    const result = await handleToolRequest('validate_subscription_journey', {
      tier: 'premium',
      fullJourney: true,
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  })();
}
```

---

## Tool vs Test Distinction

| Aspect | Test | Tool |
|--------|------|------|
| **Output** | Pass/Fail | Structured data |
| **Purpose** | Verify correctness | Provide information |
| **Caller** | Test runner | AI agent |
| **Assertions** | Required | Optional |
| **Failure handling** | Throw errors | Return error state |

### Example: Same Logic, Different Wrapping

```typescript
// AS A TEST
test('journey should be healthy', async ({ page }) => {
  const result = await validateSubscriptionJourney(page);
  expect(result.healthy).toBe(true);  // Assertion!
  expect(result.errors).toHaveLength(0);
});

// AS A TOOL
export async function validateSubscriptionJourneyTool(input) {
  const result = await validateSubscriptionJourney(page);
  return result;  // No assertion - just return data
}
```

---

## Testing Your MCP Tool

```bash
# Run the tool directly
npx ts-node src/mcp-tools/server.ts

# Expected output:
# {
#   "healthy": true,
#   "timestamp": "2024-12-19T...",
#   "environment": "staging",
#   "stages": { ... },
#   "errors": [],
#   "durationMs": 5432,
#   "recommendation": "Journey is healthy. No action required."
# }
```

---

## Key Takeaways

1. **MCP bridges AI and automation** - Let AI trigger real browser checks
2. **Structured output is essential** - JSON, not prose
3. **Same core logic, different wrapper** - Tests assert, tools report
4. **Tool metadata enables discovery** - AI knows what's available
5. **Recommendations help interpretation** - Don't just report, advise

---

## Next Phase Preview

In **Phase 8**, you'll connect this to Playwright Agents:
- AI decides when to run tools
- Intelligent automation orchestration
- Cost-aware execution

---

**Phase 7 Complete!** You've built your first Playwright MCP tool.
