# Phase 9: Final Capstone - Production-Grade Test & Agent System

**Duration**: ~4 hours
**Goal**: Prove advanced capability by assembling everything into a production-ready system.

---

## Learning Objectives

By the end of this phase, you will:

1. Assemble all curriculum components into a cohesive system
2. Demonstrate mastery of Playwright, MCP, and Agents
3. Build a system others can trust and maintain
4. Pass graduation criteria

---

## Capstone Requirements

### The System Must:

1. **Run smoke tests in production** - Read-only health checks
2. **Run regression in staging** - Comprehensive coverage
3. **Cover non-subscriber subscription purchase** - Core business flow
4. **Handle payment outcomes safely** - Mock payment scenarios
5. **Expose Playwright via MCP** - AI-callable tools
6. **Be callable by an AI agent** - Intelligent orchestration

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    CAPSTONE SYSTEM                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │   AI AGENT      │────▶│   MCP SERVER    │                    │
│  │  (Orchestrator) │     │  (Tool Host)    │                    │
│  └─────────────────┘     └────────┬────────┘                    │
│                                   │                              │
│           ┌───────────────────────┼───────────────────────┐     │
│           │                       │                       │     │
│           ▼                       ▼                       ▼     │
│  ┌─────────────────┐     ┌─────────────────┐     ┌────────────┐│
│  │ validate_journey│     │ check_pricing   │     │ run_smoke  ││
│  │     Tool        │     │     Tool        │     │    Tool    ││
│  └────────┬────────┘     └────────┬────────┘     └──────┬─────┘│
│           │                       │                     │       │
│           └───────────────────────┼─────────────────────┘       │
│                                   │                              │
│                                   ▼                              │
│                          ┌─────────────────┐                    │
│                          │    FLOWS        │                    │
│                          │  (Automation)   │                    │
│                          └────────┬────────┘                    │
│                                   │                              │
│                                   ▼                              │
│                          ┌─────────────────┐                    │
│                          │  PAGE OBJECTS   │                    │
│                          │  (UI Layer)     │                    │
│                          └────────┬────────┘                    │
│                                   │                              │
│                                   ▼                              │
│                          ┌─────────────────┐                    │
│                          │   PLAYWRIGHT    │                    │
│                          │   (Browser)     │                    │
│                          └─────────────────┘                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

Environment Awareness:
┌─────────────┐     ┌─────────────┐
│  STAGING    │     │ PRODUCTION  │
│ Full suite  │     │ Smoke only  │
│ Write ops   │     │ Read only   │
└─────────────┘     └─────────────┘
```

---

## Capstone Deliverables Checklist

### Tests

- [ ] `tests/smoke/subscription-page.smoke.spec.ts` - Production-safe landing page tests
- [ ] `tests/regression/subscription-variants.regression.spec.ts` - Staging regression
- [ ] `tests/e2e/new-customer-journey.e2e.spec.ts` - Full journey E2E
- [ ] `tests/e2e/payment-flow.e2e.spec.ts` - Payment scenario tests

### Page Objects

- [ ] `src/pages/subscription-page.ts` - Subscription selection page
- [ ] `src/pages/signin-page.ts` - Authentication page
- [ ] `src/pages/payment-page.ts` - Payment page

### Flows

- [ ] `src/flows/subscription-selection.flow.ts` - Subscription selection flow
- [ ] `src/flows/authentication.flow.ts` - Auth flow

### MCP Tools

- [ ] `src/mcp-tools/validate-subscription-journey.ts` - Journey validation tool
- [ ] `src/mcp-tools/server.ts` - MCP server

### Agent

- [ ] `src/agents/subscription-health-agent.ts` - Decision-making agent

### Configuration

- [ ] `playwright.config.ts` - Environment-aware config
- [ ] `config/environments.ts` - Environment definitions

---

## Graduation Criteria

### Criteria 1: Explain Why Each Test Exists

For each test file, document:

```typescript
/**
 * TEST: [Test Name]
 *
 * BUSINESS RISK: [What could go wrong for customers?]
 * TEST TYPE: [Smoke / Regression / E2E]
 * ENVIRONMENT: [Where this can run]
 * WHY IT EXISTS: [Specific justification]
 */
```

### Criteria 2: Justify Environment Boundaries

Be able to explain:
- Why smoke tests can run in production
- Why regression tests are staging-only
- What makes a test "production-safe"
- How environment guards prevent accidents

### Criteria 3: Debug Failures Without Retries

Demonstrate:
- Reading Playwright trace files
- Identifying root causes from screenshots
- Distinguishing flaky tests from real failures
- Fixing timing issues properly (not with waits)

### Criteria 4: Design Automation Others Trust

Your system should have:
- Clear documentation
- Consistent patterns
- Meaningful error messages
- Predictable behavior

### Criteria 5: Build Playwright MCP Tools

Demonstrate:
- Tool schema definition
- Structured JSON output
- Error handling that returns state (not throws)
- Tool metadata for discovery

### Criteria 6: Orchestrate with AI Agents

Demonstrate:
- Decision logic (when to use browser)
- Cost awareness (limiting expensive operations)
- Result interpretation (tool output → human answer)
- Fallback handling (cache when appropriate)

---

## Final Exam: Live Demonstration

### Part 1: Test Execution (20 minutes)

```bash
# Run smoke tests against production
ENVIRONMENT=production npm run test:smoke

# Run regression against staging
ENVIRONMENT=staging npm run test:regression

# Run E2E against staging
ENVIRONMENT=staging npm run test:e2e
```

Explain:
- What each test validates
- Why it's appropriate for that environment
- What failure would indicate

### Part 2: Failure Analysis (15 minutes)

Given a failing test:
1. Open the trace viewer
2. Identify the failure point
3. Explain the root cause
4. Propose a fix (not a retry)

### Part 3: MCP Tool Invocation (10 minutes)

```bash
# Run the MCP tool directly
npx ts-node src/mcp-tools/server.ts
```

Explain:
- What the tool does
- What the output means
- How an AI would use this

### Part 4: Agent Decision (15 minutes)

Present these questions to the agent:

1. "Is the subscription journey working?"
2. "What does DailyMail+ cost?"
3. "Can users sign up right now?"

For each, explain:
- Did the agent use browser automation?
- Why or why not?
- Was the decision appropriate?

---

## Example Graduation Submission

### Test Documentation Example

```typescript
/**
 * TEST: should display subscription options with pricing
 *
 * BUSINESS RISK: If customers can't see subscription options and
 * prices, they cannot make informed purchase decisions. This
 * directly impacts conversion rate and revenue.
 *
 * TEST TYPE: Smoke
 * ENVIRONMENT: Any (production-safe, read-only)
 *
 * WHY IT EXISTS: This is the entry point for all subscription
 * revenue. If this page is broken, conversion drops to zero.
 * We validate:
 * - Page loads successfully
 * - Both tiers are visible
 * - Prices are displayed
 * - CTAs are present
 *
 * This does NOT click CTAs or submit forms (production safety).
 */
test('should display subscription options with pricing', async ({ page }) => {
  // Test implementation
});
```

### Environment Justification Example

```markdown
## Why This Test is Production-Safe

1. **Read-only operations only**
   - Navigates to pages (GET requests)
   - Verifies content visibility
   - Does not click forms or submit data

2. **No state modification**
   - Creates no accounts
   - Modifies no database records
   - Sends no emails

3. **No payment interaction**
   - Stops before checkout
   - Never enters payment details
   - Cannot create charges

4. **Minimal footprint**
   - Single browser session
   - Short execution time (<30s)
   - No parallel load
```

---

## Congratulations!

Upon completing this capstone, you have demonstrated:

1. **Playwright mastery** - From basics to advanced patterns
2. **Test architecture skills** - Smoke, regression, E2E
3. **Production awareness** - Safe automation practices
4. **Tool building capability** - MCP integration
5. **AI orchestration understanding** - Agent patterns

You are now qualified to:
- Design test automation strategies
- Build production-grade test systems
- Create AI-callable automation tools
- Mentor others in Playwright testing

---

## What's Next?

Continue your journey:

1. **Expand MCP tools** - Add more automation capabilities
2. **Integrate with CI/CD** - Automated test pipelines
3. **Visual regression** - Screenshot comparison testing
4. **API testing** - Complement UI tests with API coverage
5. **Accessibility testing** - Axe integration
6. **Performance testing** - Lighthouse integration

---

**Curriculum Complete!**

You started with basic Playwright setup and finished with an AI-orchestrated, production-grade automation system. Well done!
