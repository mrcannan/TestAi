# Phase 0: Environment, AI Setup & Mental Models

**Duration**: ~2 hours
**Goal**: Prepare the learner to use Copilot as a teacher, not a crutch.

---

## Learning Objectives

By the end of this phase, you will:

1. Have a fully configured Playwright + TypeScript environment
2. Understand Copilot's role as a tutor (not just code generator)
3. Know what Playwright controls and how auto-waiting works
4. Understand why UI automation is expensive and deliberate

---

## Setup Checklist

### 1. Install VS Code

Download from: https://code.visualstudio.com/

### 2. Install Required Extensions

Open VS Code and install:

- **GitHub Copilot** - AI pair programmer
- **GitHub Copilot Chat** - Interactive AI assistant
- **Playwright Test for VS Code** - Test runner and debugging
- **ESLint** - Code quality
- **Prettier** - Code formatting

### 3. Install Node.js

Requires Node.js 18+. Download from: https://nodejs.org/

Verify installation:
```bash
node --version  # Should be 18.x or higher
npm --version
```

### 4. Clone and Setup Project

```bash
# Navigate to your projects directory
cd ~/projects

# Clone the curriculum repository
git clone <repository-url> testpilot-ai-curriculum
cd testpilot-ai-curriculum

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### 5. Verify Playwright Installation

```bash
# Run a quick verification
npx playwright test --version

# Open Playwright Inspector (should show browser)
npx playwright codegen https://www.mailsubscriptions.co.uk
```

---

## Understanding the Copilot Teaching Contract

**CRITICAL**: Read `.github/copilot-instructions/COPILOT-TEACHING-CONTRACT.md`

This contract defines how Copilot behaves in this curriculum:

### Copilot Will:

1. **Explain before coding** - Concepts first, code second
2. **Ask clarifying questions** - Never assume your intent
3. **Flag flaky patterns** - Warn about unstable code
4. **Refuse unexplained waits** - No arbitrary `waitForTimeout()`

### Copilot Won't:

1. Generate code without explanation
2. Use brittle selectors without warning
3. Skip assertions in tests
4. Ignore business risk context

---

## Mental Models for Playwright

### Mental Model 1: Playwright Controls the Browser

Playwright is NOT:
- A screen scraper
- A macro recorder
- A simple HTTP client

Playwright IS:
- A browser automation library
- Controlling real Chrome/Firefox/WebKit instances
- Simulating real user interactions

```
Your Code → Playwright → Browser DevTools Protocol → Browser → Website
```

### Mental Model 2: Auto-Waiting is Your Friend

Playwright automatically waits for elements to be:
- **Attached** to the DOM
- **Visible** on the page
- **Stable** (not animating)
- **Enabled** (for interactions)
- **Receiving events** (not obscured)

**This means you rarely need manual waits!**

```typescript
// BAD - Manual wait (usually unnecessary)
await page.waitForTimeout(2000);
await page.click('button');

// GOOD - Auto-waiting handles this
await page.click('button');  // Playwright waits automatically
```

### Mental Model 3: Tests Should Map to Business Risk

Every test should answer: **"What could go wrong for the customer?"**

| Business Risk | Test Coverage |
|--------------|---------------|
| Customer can't see subscription options | Smoke test: options visible |
| Pricing displays incorrectly | Regression: price validation |
| Checkout flow breaks | E2E: complete purchase journey |
| Payment fails silently | E2E: error handling |

### Mental Model 4: Smoke ≠ Regression ≠ E2E

| Type | Purpose | Environment | Speed |
|------|---------|-------------|-------|
| **Smoke** | "Is the site up and functional?" | Any (including prod) | Fast (<30s) |
| **Regression** | "Did we break anything?" | Staging only | Medium (1-5 min) |
| **E2E** | "Does the full journey work?" | Staging only | Slow (5-15 min) |

### Mental Model 5: UI Automation is Expensive

UI tests are:
- **Slow** compared to unit/API tests
- **Brittle** if not written carefully
- **Valuable** for user-facing validation

> "Write the fewest UI tests that give you confidence."

The testing pyramid:
```
        /\
       /UI\        <- Few, high-value
      /----\
     / API  \      <- More coverage
    /--------\
   /  Unit    \    <- Most coverage
  /____________\
```

---

## Hands-On Exercise: Verify Your Setup

### Exercise 0.1: Open Playwright Inspector

```bash
npx playwright codegen https://www.mailsubscriptions.co.uk/info/425365/choose-your-subscription
```

**Observe:**
1. A browser window opens
2. Actions are recorded as you interact
3. Selectors are suggested for each element

**Try:**
1. Click on a subscription option
2. See the generated code
3. Notice the selector strategy Playwright uses

### Exercise 0.2: Run the Example Test

Create a file `tests/example.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('Playwright is working', async ({ page }) => {
  await page.goto('https://www.mailsubscriptions.co.uk/info/425365/choose-your-subscription');
  await expect(page).toHaveTitle(/Daily Mail/);
});
```

Run it:
```bash
npx playwright test tests/example.spec.ts --headed
```

### Exercise 0.3: Ask Copilot to Explain

Open Copilot Chat and ask:

> "Explain how Playwright's auto-waiting works and when I might still need explicit waits."

**Expected**: Copilot explains the concept before providing examples.

---

## Key Takeaways

1. **Setup complete**: VS Code + Playwright + Copilot ready
2. **Copilot contract understood**: Tutor, not code generator
3. **Mental models established**:
   - Playwright controls real browsers
   - Auto-waiting reduces manual waits
   - Tests map to business risk
   - Different test types serve different purposes
   - UI automation should be deliberate

---

## Next Phase Preview

In **Phase 1**, you'll write your first real smoke test:
- Navigate to the subscription page
- Assert subscription options are visible
- Confirm the primary CTA is usable

**Homework before Phase 1:**
1. Spend 10 minutes exploring the subscription page manually
2. Note what a customer needs to see/do
3. Think: "What could go wrong here?"

---

## Troubleshooting

### Browser doesn't open
```bash
# Reinstall browsers
npx playwright install --force
```

### Permission errors on Mac
```bash
# Allow Playwright browsers
xattr -d com.apple.quarantine ~/Library/Caches/ms-playwright/*
```

### Copilot not responding
1. Check VS Code is signed into GitHub
2. Verify Copilot subscription is active
3. Restart VS Code

---

**Phase 0 Complete!** You're ready to write your first smoke test.
