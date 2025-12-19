# TestPilot AI Curriculum

## Learn Playwright Testing from Scratch

**A Beginner-Friendly, Hands-On Course Using Real Website Testing**

---

## What Is This Course?

This course teaches you how to write automated tests for websites using a tool called **Playwright**. You'll learn by testing a real subscription website, not fake examples.

By the end, you'll be able to:
- Write tests that check if a website is working correctly
- Find bugs before your customers do
- Use AI (GitHub Copilot) to help you write better tests
- Build advanced automation tools

**No prior programming experience required** - but basic computer skills are needed.

---

## What You'll Be Testing

You'll practice on a real website:
https://www.mailsubscriptions.co.uk/info/425365/choose-your-subscription

You'll learn to test:
1. Can customers see subscription options?
2. Can customers sign up for an account?
3. Does the checkout process work?
4. What happens when something goes wrong?

---

## Course Outline

| Phase | What You'll Learn | Time Needed |
|-------|-------------------|-------------|
| 0 | Setting up your computer | 2 hours |
| 1 | Your first test | 3 hours |
| 2 | Testing different scenarios | 4 hours |
| 3 | Testing a complete customer journey | 4 hours |
| 4 | Testing payments safely | 4 hours |
| 5 | Testing on different environments | 2 hours |
| 6 | Making your tests reusable | 3 hours |
| 7 | Advanced: AI-powered tools | 4 hours |
| 8 | Advanced: AI agents | 4 hours |
| 9 | Final project | 4 hours |

**Total time: About 34 hours** (can be spread over several weeks)

---

## Before You Start: Setup Checklist

Complete these steps **in order** before starting the course.

### Step 1: Check Your Computer

Make sure your computer meets these requirements:

- [ ] **Windows 10 or newer**, OR **Mac (macOS 10.15 or newer)**, OR **Linux (Ubuntu 20.04 or newer)**
- [ ] **At least 8GB of RAM** (check: Windows - Right-click "This PC" > Properties; Mac - Apple menu > About This Mac)
- [ ] **At least 2GB of free disk space**
- [ ] **Reliable internet connection**

---

### Step 2: Create a GitHub Account (Free)

GitHub is where programmers store and share code. You need an account for Copilot.

1. Go to [github.com](https://github.com)
2. Click **"Sign up"** in the top right
3. Follow the steps to create your free account
4. **Verify your email address** (check your inbox)

- [ ] I have a GitHub account and verified my email

---

### Step 3: Subscribe to GitHub Copilot (Paid)

GitHub Copilot is an AI assistant that will help you learn. **This is required for the course.**

**Cost: £8/month (individual) or £15/month (business)**

*Free options: Students can get it free via [GitHub Education](https://education.github.com/students)*

1. Go to [github.com/features/copilot](https://github.com/features/copilot)
2. Click **"Start my free trial"** (30 days free)
3. Enter your payment details
4. Complete the signup

- [ ] I have an active GitHub Copilot subscription

---

### Step 4: Install Node.js

Node.js lets your computer run JavaScript code (which Playwright uses).

**For Windows:**
1. Go to [nodejs.org](https://nodejs.org/)
2. Click the green button that says **"LTS"** (Long Term Support)
3. Open the downloaded file
4. Click **"Next"** through all the steps, keeping default options
5. Click **"Install"**
6. Click **"Finish"**

**For Mac:**
1. Go to [nodejs.org](https://nodejs.org/)
2. Click the green button that says **"LTS"**
3. Open the downloaded `.pkg` file
4. Follow the installation wizard

**Verify it worked:**
1. Open **Terminal** (Mac) or **Command Prompt** (Windows - search "cmd")
2. Type: `node --version`
3. Press Enter
4. You should see something like `v20.10.0` (the number should be 18 or higher)

- [ ] Node.js is installed and `node --version` shows v18 or higher

---

### Step 5: Install Git

Git is a tool for downloading and managing code.

**For Windows:**
1. Go to [git-scm.com/download/win](https://git-scm.com/download/win)
2. The download should start automatically
3. Open the downloaded file
4. Click **"Next"** through all steps, keeping default options
5. Click **"Install"**

**For Mac:**
1. Open **Terminal** (search for it in Spotlight)
2. Type: `git --version`
3. If Git isn't installed, a popup will ask to install developer tools - click **"Install"**

**Verify it worked:**
1. Open Terminal or Command Prompt
2. Type: `git --version`
3. You should see something like `git version 2.42.0`

- [ ] Git is installed and `git --version` shows a version number

---

### Step 6: Install VS Code

VS Code is a free code editor where you'll write your tests.

1. Go to [code.visualstudio.com](https://code.visualstudio.com/)
2. Click the big blue **"Download"** button
3. Open the downloaded file
4. **Windows**: Run the installer, check "Add to PATH", click Install
5. **Mac**: Drag the VS Code icon to your Applications folder
6. Open VS Code to make sure it works

- [ ] VS Code is installed and opens successfully

---

### Step 7: Install VS Code Extensions

Extensions add extra features to VS Code. You need these for the course.

**How to install extensions:**
1. Open VS Code
2. Click the **Extensions icon** in the left sidebar (looks like 4 squares)
3. Search for each extension by name
4. Click **"Install"**

**Required extensions:**

1. **GitHub Copilot**
   - Search: `GitHub Copilot`
   - Click Install
   - You'll be asked to sign in to GitHub - do this

2. **GitHub Copilot Chat**
   - Search: `GitHub Copilot Chat`
   - Click Install

3. **Playwright Test for VS Code**
   - Search: `Playwright Test`
   - Click Install (the one by Microsoft)

- [ ] GitHub Copilot extension installed and signed in
- [ ] GitHub Copilot Chat extension installed
- [ ] Playwright Test extension installed

---

### Step 8: Download This Course

Now you'll download all the course files to your computer.

1. Open **Terminal** (Mac) or **Command Prompt** (Windows)
2. Navigate to where you want to store the course. For example:
   - Windows: Type `cd Documents` and press Enter
   - Mac: Type `cd ~/Documents` and press Enter
3. Download the course by typing:
   ```
   git clone https://github.com/mrcannan/TestAi.git
   ```
4. Press Enter and wait for it to download
5. Go into the course folder:
   ```
   cd TestAi
   ```

- [ ] Course files downloaded successfully

---

### Step 9: Install Course Dependencies

Dependencies are other tools that the course needs to work.

1. Make sure you're in the course folder (from Step 8)
2. Type this command and press Enter:
   ```
   npm install
   ```
3. Wait for it to finish (may take a few minutes)
4. Then type this command and press Enter:
   ```
   npx playwright install
   ```
5. Wait for the browsers to download (this downloads test browsers)

- [ ] `npm install` completed without errors
- [ ] `npx playwright install` completed without errors

---

### Step 10: Verify Everything Works

Let's make sure your setup is correct.

1. In Terminal/Command Prompt (still in the course folder), type:
   ```
   npx playwright test --project=chromium --headed tests/smoke/
   ```
2. Press Enter
3. A browser window should open and run a quick test
4. You should see a success message

**If you see errors**, go back and check each step was completed correctly.

- [ ] Test ran successfully and browser opened

---

## You're Ready!

If all checkboxes above are ticked, you're ready to start the course.

**Next step:** Open the file `curriculum/PHASE-0-ENVIRONMENT.md` in VS Code to begin.

---

## Cost Summary

| Item | Cost | Notes |
|------|------|-------|
| Node.js | Free | |
| VS Code | Free | |
| Git | Free | |
| Playwright | Free | |
| GitHub Copilot | £8-15/month | **Required** - 30-day free trial available |
| VS Code Extensions | Free | |

**Total: ~£8/month** (or free for students)

---

## Getting Help

**Stuck on setup?** Try these:
1. Restart your computer and try again
2. Search the error message on Google
3. Ask GitHub Copilot Chat for help (once installed)

**Questions about the course?** Contact: Conrad Annan

---

## Quick Reference: Running Tests

Once set up, here are the commands you'll use:

| What you want to do | Command to type |
|---------------------|-----------------|
| Run smoke tests | `npm run test:smoke` |
| Run regression tests | `npm run test:regression` |
| Run tests with visual browser | `npm run test:ui` |
| Run a specific test file | `npx playwright test tests/smoke/subscription-page.smoke.spec.ts --headed` |

---

## Course Files Overview

```
TestAi/
├── curriculum/          <- Course lessons (start here!)
│   ├── PHASE-0-ENVIRONMENT.md
│   ├── PHASE-1-FIRST-SMOKE-TEST.md
│   └── ... (more phases)
│
├── tests/               <- Your test files
│   ├── smoke/           <- Quick health checks
│   ├── regression/      <- Thorough tests
│   └── e2e/             <- Full journey tests
│
├── src/                 <- Supporting code
│   ├── pages/           <- Page helpers
│   ├── flows/           <- Journey helpers
│   └── utils/           <- Utilities
│
└── config/              <- Settings
```

---

**Version**: 1.0.0
**Last Updated**: 2024-12-19
**Author**: Conrad Annan
