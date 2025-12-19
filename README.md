# TestPilot AI Curriculum

## Playwright → Playwright Agents → Playwright MCP

**Hands-On Curriculum Using MailSubscriptions Subscription Journey**

---

## Overview

This is a hands-on, Copilot-led curriculum grounded in real smoke + regression test building, evolving naturally into Playwright Agents and Playwright MCP inside VS Code.

**No abstractions. No toy apps.**

### Primary Learning Vehicle
https://www.mailsubscriptions.co.uk/info/425365/choose-your-subscription

### Core Journeys Covered
1. New customer (non-subscriber) subscription purchase
2. Existing subscriber journey (login / continuation assumptions)
3. End-to-end subscription checkout including payment
4. Smoke vs regression validation across staging and production

### Teaching Method
GitHub Copilot acts as interactive tutor, reviewer, and examiner inside VS Code.

---

## Curriculum Phases

| Phase | Focus | Duration | Key Deliverable |
|-------|-------|----------|-----------------|
| 0 | Environment, AI Setup & Mental Models | 2 hours | Configured workspace with Copilot teaching contract |
| 1 | First Smoke Test: "Choose a Subscription" | 3 hours | Working smoke test for subscription page |
| 2 | Regression Foundations: Subscription Variants | 4 hours | Parameterised regression test pack |
| 3 | New Customer Journey: Details & Progression | 4 hours | End-to-end flow test |
| 4 | Payment Flow Testing | 4 hours | Happy path + failure scenario tests |
| 5 | Environment Strategy: Staging vs Production | 2 hours | Environment-aware configuration |
| 6 | From Tests to Automation Capabilities | 3 hours | Refactored reusable flows |
| 7 | Playwright MCP: Turning Tests into Tools | 4 hours | MCP tool implementation |
| 8 | Playwright Agents: AI-Driven Execution | 4 hours | Agent-callable automation |
| 9 | Final Capstone | 4 hours | Production-grade test & agent system |

**Total Duration: ~34 hours**

---

## Guiding Principles

These are enforced throughout the curriculum:

- **Learning happens by building and evolving real tests**
- **Copilot must explain before coding**
- **Every test must map to real business risk**
- **Smoke ≠ Regression**
- **Production ≠ Staging**
- **Playwright tests eventually become Playwright tools**

---

## Project Structure

```
testpilot-ai-curriculum/
├── README.md                          # This file
├── package.json                       # Project dependencies
├── playwright.config.ts               # Playwright configuration
├── tsconfig.json                      # TypeScript configuration
│
├── curriculum/                        # Learning materials
│   ├── PHASE-0-ENVIRONMENT.md
│   ├── PHASE-1-FIRST-SMOKE-TEST.md
│   ├── PHASE-2-REGRESSION.md
│   ├── PHASE-3-CUSTOMER-JOURNEY.md
│   ├── PHASE-4-PAYMENT-FLOW.md
│   ├── PHASE-5-ENVIRONMENT-STRATEGY.md
│   ├── PHASE-6-AUTOMATION-CAPABILITIES.md
│   ├── PHASE-7-PLAYWRIGHT-MCP.md
│   ├── PHASE-8-PLAYWRIGHT-AGENTS.md
│   └── PHASE-9-CAPSTONE.md
│
├── tests/                             # Test files
│   ├── smoke/                         # Smoke tests (production-safe)
│   │   └── subscription-page.smoke.spec.ts
│   ├── regression/                    # Regression tests (staging only)
│   │   └── subscription-variants.regression.spec.ts
│   └── e2e/                          # End-to-end tests
│       ├── new-customer-journey.e2e.spec.ts
│       └── payment-flow.e2e.spec.ts
│
├── src/                               # Source code
│   ├── pages/                         # Page Object Models
│   │   ├── subscription-page.ts
│   │   ├── signin-page.ts
│   │   ├── customer-details-page.ts
│   │   └── payment-page.ts
│   ├── flows/                         # Reusable flows
│   │   ├── subscription-selection.flow.ts
│   │   ├── authentication.flow.ts
│   │   └── checkout.flow.ts
│   ├── utils/                         # Utilities
│   │   ├── test-data.ts
│   │   └── assertions.ts
│   └── mcp-tools/                     # Playwright MCP tools
│       └── validate-subscription-journey.ts
│
├── config/                            # Environment configs
│   ├── staging.config.ts
│   └── production.config.ts
│
└── .github/
    └── copilot-instructions/          # Copilot teaching contract
        └── COPILOT-TEACHING-CONTRACT.md
```

---

## Prerequisites Checklist

Before starting this curriculum, ensure you have the following installed and configured:

### Required Software

- [ ] **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
  - Verify: `node --version` should return `v18.x.x` or higher
- [ ] **Git** - Download from [git-scm.com](https://git-scm.com/)
  - Verify: `git --version`
- [ ] **VS Code** - Download from [code.visualstudio.com](https://code.visualstudio.com/)

### Required VS Code Extensions

- [ ] **GitHub Copilot** (PAID SUBSCRIPTION REQUIRED)
  - Install from VS Code Extensions marketplace
  - Requires GitHub Copilot subscription (£8/month individual or £15/month business)
  - Sign up at [github.com/features/copilot](https://github.com/features/copilot)
  - Students and open source maintainers may qualify for free access
- [ ] **GitHub Copilot Chat**
  - Included with GitHub Copilot subscription
  - Enables interactive AI tutoring experience
- [ ] **Playwright Test for VS Code**
  - Free extension for running and debugging tests
  - Search "Playwright Test" in Extensions

### Recommended VS Code Extensions (Optional)

- [ ] **ESLint** - Code quality linting
- [ ] **Prettier** - Code formatting
- [ ] **TypeScript Hero** - TypeScript productivity

### Account Requirements

- [ ] **GitHub Account** - Required for Copilot
- [ ] **Active GitHub Copilot Subscription** - Required for interactive learning
  - Free trial available for 30 days
  - Free for verified students via GitHub Education

### System Requirements

- [ ] **Operating System**: Windows 10+, macOS 10.15+, or Ubuntu 20.04+
- [ ] **RAM**: Minimum 8GB (16GB recommended)
- [ ] **Disk Space**: 2GB for browsers and dependencies
- [ ] **Internet Connection**: Required for Copilot and test execution

---

## Cost Summary

| Item | Cost | Notes |
|------|------|-------|
| Node.js | Free | Open source |
| VS Code | Free | Open source |
| Git | Free | Open source |
| Playwright | Free | Open source |
| GitHub Copilot | £8-15/month | **Required for full curriculum experience** |
| VS Code Extensions | Free | All recommended extensions are free |

**Total minimum cost**: GitHub Copilot subscription (~£8/month or free for students)

---

## Getting Started

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd testpilot-ai-curriculum

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Verify setup
npx playwright test --project=chromium --headed tests/smoke/
```

### Running Tests

```bash
# Run smoke tests (production-safe)
npm run test:smoke

# Run regression tests (staging only)
npm run test:regression

# Run all tests with UI
npm run test:ui

# Run specific phase tests
npm run test:phase1
```

---

## Graduation Criteria

Upon completing this curriculum, the learner can:

1. **Explain why each test exists** - Map tests to business risk
2. **Justify environment boundaries** - Know when smoke vs regression applies
3. **Debug failures without retries** - Root cause analysis skills
4. **Design automation others trust** - Production-grade test architecture
5. **Build Playwright MCP tools** - Expose automation as callable tools
6. **Orchestrate with AI agents** - Let AI decide when to automate

---

## Support

For questions about this curriculum, contact: Conrad Annan

---

**Version**: 1.0.0
**Last Updated**: 2024-12-19
**Author**: Conrad Annan
