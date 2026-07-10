---
name: ksh-test
description: "Use when verifying behavior after a code change - runs graded checks with a bounded auto-fix loop and test evidence."
---

## Overview

Runs graded verification (quick / standard / deep) with a bounded 2-attempt auto-fix loop and writes test evidence reports.

## When to Use

Use when verifying behavior after code changes with structured test evidence.

## Process

1. Pick the verification level and announce it with the reason:
   - quick: typecheck + lint only. Only for changes with no runtime behavior
     (docs, comments, copy text).
   - standard (default): quick + build + unit tests.
   - deep: standard + coverage report + integration/e2e suites if the project
     has them. Use for /ksh full, risky changes, or when the human asks.
2. Detect the stack and pick the commands:
   - JS/TS (package.json): the lockfile picks the runner -
     pnpm-lock.yaml -> pnpm, yarn.lock -> yarn, bun.lock/bun.lockb -> bun,
     else npm. Test: `<runner> test` (or the project's configured script).
     Typecheck: `tsc --noEmit` when tsconfig.json exists. Lint: the project's
     eslint/biome script when configured.
   - pom.xml -> `mvn -q test`
   - build.gradle / build.gradle.kts -> `./gradlew test`
   - pubspec.yaml -> `flutter test`
   - pyproject.toml / pytest.ini -> `pytest`
   - go.mod -> `go test ./...`
   - Cargo.toml -> `cargo test`
   - *.csproj / *.sln -> `dotnet test`
   If none match, ask the user for the commands.
   For deep level, also detect e2e: playwright.config.* -> `npx playwright
   test`; cypress.config.* -> `npx cypress run`.
3. Run the checks for the chosen level.
4. Auto-fix loop (max 2 attempts):
   - all green: go to step 5.
   - failing: read the log, apply a fix, re-run. Count the attempt.
   - after 2 failed attempts: STOP, summarize the failure, suggest /ksh-fix.
     Do not continue with failing tests.
5. Ask "Export UT report to file?" If yes, write
   reports/ut-report-<slug>-<date>.md with: verification level, pass/fail
   counts, each failing test's output verbatim, the runner's summary tail
   (NOT the full raw log - large suites bloat the report), coverage if
   available. Never write silently.
6. Optional GATE: offer to stop for human review of results. Skip if trivial
   or bypass requested.

## Anti-rationalization

| Excuse | Reality |
|--------|---------|
| "Tests are flaky, just rerun forever." | Loop is bounded at 2. Escalate, do not spin. |
| "I'll add tests later." | Later never comes. Cover the change now. |
| "Quick level is faster, use it everywhere." | Quick is only for changes with no runtime behavior. Code changes get standard or deep. |

## Red Flags

Flaky tests and missing test coverage block progress.

## Verification

Verification level was announced with a reason, its checks ended green OR
escalated after 2 attempts, and evidence was offered.
