---
agent: 'agent'
model: ["Claude Sonnet 4.6","GPT-4.1"]
description: "Run unit tests with a bounded auto-fix loop and write evidence. Use when verifying behavior after a code change."
---

## Overview

Runs tests with a bounded 2-attempt auto-fix loop and writes test evidence reports.

## When to Use

Use when verifying behavior after code changes with structured test evidence.

## Process

1. Detect the stack and pick the test command:
   - package.json -> npm test (or the project's configured script)
   - pom.xml      -> mvn -q test
   - build.gradle / build.gradle.kts -> ./gradlew test
   - pubspec.yaml -> flutter test
   If none match, ask the user for the test command.
2. Run the tests.
3. Auto-fix loop (max 2 attempts):
   - all green: go to step 4.
   - failing: read the log, apply a fix, re-run. Count the attempt.
   - after 2 failed attempts: STOP, summarize the failure, suggest /ksh-fix.
     Do not continue with failing tests.
4. Ask "Export UT report to file?" If yes, write
   reports/ut-report-<slug>-<date>.md with: raw test output, pass/fail counts,
   coverage if available. Never write silently.
5. Optional GATE: offer to stop for human review of results. Skip if trivial
   or bypass requested.

## Anti-rationalization

| Excuse | Reality |
|--------|---------|
| "Tests are flaky, just rerun forever." | Loop is bounded at 2. Escalate, do not spin. |
| "I'll add tests later." | Later never comes. Cover the change now. |

## Red Flags

Flaky tests and missing test coverage block progress.

## Verification

Tests ended green OR escalated after 2 attempts; evidence offered.
