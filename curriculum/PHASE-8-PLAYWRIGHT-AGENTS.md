# Phase 8: Playwright Agents - AI-Driven Execution

**Duration**: ~4 hours
**Goal**: Let AI decide when to automate.

---

## Learning Objectives

By the end of this phase, you will:

1. Understand the Playwright Agent pattern
2. Create decision logic for automation
3. Build cost-aware execution strategies
4. Orchestrate MCP tools intelligently

---

## The Agent Pattern

An **Agent** is an AI system that:
1. Receives a goal
2. Decides what actions to take
3. Executes actions (including calling tools)
4. Interprets results
5. Continues or concludes

```
User Question: "Is the subscription journey healthy?"
                    │
                    ▼
              ┌─────────────┐
              │    Agent    │
              │  (Decides)  │
              └──────┬──────┘
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
   No tool       Call MCP       Web search
   needed        tool            (fallback)
       │             │
       │             ▼
       │     ┌─────────────────┐
       │     │ Playwright Tool │
       │     │   (Executes)    │
       │     └────────┬────────┘
       │              │
       └──────────────┼──────────────┐
                      ▼              │
              ┌─────────────┐        │
              │    Agent    │        │
              │ (Interprets)│◄───────┘
              └──────┬──────┘
                     │
                     ▼
               Final Answer
```

---

## When Should AI Use Browser Automation?

### Decision Matrix

| Scenario | Browser Needed? | Why |
|----------|-----------------|-----|
| "Is the site up?" | Maybe | Could check API first |
| "Can users subscribe?" | Yes | Requires UI interaction |
| "What's the price?" | Maybe | If cached data available, no |
| "Is checkout working?" | Yes | Requires full flow test |
| "When was last downtime?" | No | Check monitoring data |

### Cost Considerations

```
Browser Automation Cost:
- Time: 5-30 seconds per check
- Resources: Browser instance, memory
- Rate limits: May trigger bot detection

vs.

API/Cache Check Cost:
- Time: <100ms
- Resources: Minimal
- Rate limits: Usually more lenient
```

---

## Agent Decision Logic

Create `src/agents/subscription-health-agent.ts`:

```typescript
/**
 * Subscription Health Agent
 *
 * Decides whether browser automation is needed to answer
 * questions about subscription journey health.
 */

import { validateSubscriptionJourneyTool } from '../mcp-tools/validate-subscription-journey';

export interface AgentQuery {
  question: string;
  context?: {
    lastCheckTimestamp?: string;
    cachedHealth?: boolean;
    urgency?: 'low' | 'medium' | 'high';
  };
}

export interface AgentResponse {
  answer: string;
  usedBrowserAutomation: boolean;
  reasoning: string;
  data?: unknown;
  cost: {
    timeMs: number;
    browserUsed: boolean;
  };
}

/**
 * Keywords that suggest browser automation is needed
 */
const BROWSER_REQUIRED_PATTERNS = [
  /work(s|ing)?/i,
  /function(al|ing)?/i,
  /broken/i,
  /check.*journey/i,
  /test.*flow/i,
  /validate/i,
  /can.*subscribe/i,
  /can.*sign.*up/i,
];

/**
 * Keywords that suggest cached data is sufficient
 */
const CACHE_SUFFICIENT_PATTERNS = [
  /price/i,
  /cost/i,
  /how much/i,
  /features/i,
  /what.*include/i,
];

/**
 * Analyze query to determine if browser automation is needed
 */
function shouldUseBrowserAutomation(query: AgentQuery): {
  shouldUse: boolean;
  reason: string;
} {
  const { question, context } = query;

  // Check for cache-sufficient patterns first
  for (const pattern of CACHE_SUFFICIENT_PATTERNS) {
    if (pattern.test(question)) {
      return {
        shouldUse: false,
        reason: 'Question can be answered from known data without browser check',
      };
    }
  }

  // Check for patterns requiring browser
  for (const pattern of BROWSER_REQUIRED_PATTERNS) {
    if (pattern.test(question)) {
      return {
        shouldUse: true,
        reason: 'Question requires live validation of journey functionality',
      };
    }
  }

  // Check urgency
  if (context?.urgency === 'high') {
    return {
      shouldUse: true,
      reason: 'High urgency requires fresh browser validation',
    };
  }

  // Check cache freshness
  if (context?.lastCheckTimestamp) {
    const lastCheck = new Date(context.lastCheckTimestamp);
    const minutesAgo = (Date.now() - lastCheck.getTime()) / 1000 / 60;

    if (minutesAgo < 5 && context.cachedHealth !== undefined) {
      return {
        shouldUse: false,
        reason: `Recent check (${Math.round(minutesAgo)} min ago) available`,
      };
    }
  }

  // Default: use browser for definitive answer
  return {
    shouldUse: true,
    reason: 'Default to browser check for authoritative answer',
  };
}

/**
 * Main agent function
 */
export async function subscriptionHealthAgent(
  query: AgentQuery
): Promise<AgentResponse> {
  const startTime = Date.now();

  // Step 1: Decide if browser automation is needed
  const decision = shouldUseBrowserAutomation(query);

  // Step 2: Execute appropriate path
  if (decision.shouldUse) {
    // Run browser automation
    const result = await validateSubscriptionJourneyTool({
      tier: 'premium',
      fullJourney: true,
    });

    return {
      answer: generateAnswer(query.question, result),
      usedBrowserAutomation: true,
      reasoning: decision.reason,
      data: result,
      cost: {
        timeMs: Date.now() - startTime,
        browserUsed: true,
      },
    };
  } else {
    // Answer from knowledge/cache
    return {
      answer: generateCachedAnswer(query),
      usedBrowserAutomation: false,
      reasoning: decision.reason,
      cost: {
        timeMs: Date.now() - startTime,
        browserUsed: false,
      },
    };
  }
}

/**
 * Generate answer from browser automation results
 */
function generateAnswer(
  question: string,
  result: Awaited<ReturnType<typeof validateSubscriptionJourneyTool>>
): string {
  if (result.healthy) {
    return `The subscription journey is healthy. All stages are functioning correctly.
    - Subscription page: Reachable, tiers visible, CTAs working
    - Sign-in page: Reachable, form functional
    - Check completed in ${result.durationMs}ms`;
  } else {
    return `The subscription journey has issues: ${result.recommendation}
    Errors found: ${result.errors.join(', ')}
    Check completed in ${result.durationMs}ms`;
  }
}

/**
 * Generate answer from cached/known data
 */
function generateCachedAnswer(query: AgentQuery): string {
  const question = query.question.toLowerCase();

  if (question.includes('price') || question.includes('cost')) {
    return `DailyMail+ subscription pricing:
    - Premium (DailyMail+): £9.99/month after trial
    - Basic (DailyMail+ Basic): £6.99/month after trial
    Both include first month free, then £1.99/month for 11 months trial.`;
  }

  if (question.includes('feature')) {
    return `DailyMail+ features:
    - Unlimited access to Daily Mail
    - 850+ exclusive articles per month
    - Weekly newsletter
    Premium adds: 80% fewer ads, 25+ daily puzzles`;
  }

  return 'I can answer this based on known information without running a browser check.';
}
```

---

## Using the Agent

```typescript
// Example usage
import { subscriptionHealthAgent } from './agents/subscription-health-agent';

// Question requiring browser automation
const result1 = await subscriptionHealthAgent({
  question: 'Is the subscription journey working right now?',
  context: { urgency: 'high' },
});

console.log(result1);
// {
//   answer: "The subscription journey is healthy...",
//   usedBrowserAutomation: true,
//   reasoning: "Question requires live validation...",
//   cost: { timeMs: 5432, browserUsed: true }
// }

// Question answerable from cache
const result2 = await subscriptionHealthAgent({
  question: 'What does DailyMail+ cost?',
});

console.log(result2);
// {
//   answer: "DailyMail+ subscription pricing: ...",
//   usedBrowserAutomation: false,
//   reasoning: "Question can be answered from known data...",
//   cost: { timeMs: 5, browserUsed: false }
// }
```

---

## Cost-Aware Execution

```typescript
/**
 * Cost-aware agent wrapper
 *
 * Tracks cumulative costs and enforces limits.
 */

interface CostTracker {
  browserChecksToday: number;
  maxBrowserChecksPerDay: number;
  lastReset: Date;
}

const costTracker: CostTracker = {
  browserChecksToday: 0,
  maxBrowserChecksPerDay: 100, // Configurable limit
  lastReset: new Date(),
};

export async function costAwareAgent(query: AgentQuery): Promise<AgentResponse> {
  // Reset daily counter if needed
  const today = new Date().toDateString();
  if (costTracker.lastReset.toDateString() !== today) {
    costTracker.browserChecksToday = 0;
    costTracker.lastReset = new Date();
  }

  // Check if we're at limit
  if (costTracker.browserChecksToday >= costTracker.maxBrowserChecksPerDay) {
    // Force cache-only response
    return {
      answer: 'Browser check limit reached for today. Using cached data.',
      usedBrowserAutomation: false,
      reasoning: `Daily limit of ${costTracker.maxBrowserChecksPerDay} browser checks reached`,
      cost: { timeMs: 0, browserUsed: false },
    };
  }

  // Run agent
  const result = await subscriptionHealthAgent(query);

  // Track if browser was used
  if (result.usedBrowserAutomation) {
    costTracker.browserChecksToday++;
  }

  return result;
}
```

---

## Agent Capabilities Summary

| Capability | Description |
|------------|-------------|
| **Decision making** | Determines if browser automation is needed |
| **Tool orchestration** | Calls MCP tools when appropriate |
| **Cost awareness** | Tracks and limits expensive operations |
| **Result interpretation** | Converts tool output to human answers |
| **Fallback handling** | Uses cached data when appropriate |

---

## Key Takeaways

1. **Agents decide, tools execute** - Clear separation of concerns
2. **Not every question needs browser** - Be cost-aware
3. **Cached data has value** - Use it when appropriate
4. **Limits prevent runaway costs** - Budget browser usage
5. **Reasoning is transparent** - Agent explains its decisions

---

## Next Phase Preview

In **Phase 9**, you'll bring everything together:
- Production-grade test system
- Complete agent integration
- Capstone validation

---

**Phase 8 Complete!** You understand AI-driven automation orchestration.
