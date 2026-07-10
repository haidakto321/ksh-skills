---
agent: 'agent'
description: "Use when a specific bug is reported on existing code - reproduces, root-causes and fixes it with test evidence."
---

## Overview

Reproduces, locates and fixes reported bugs on existing code with test evidence.

## When to Use

Use when a specific bug is reported and needs root-cause fix with test coverage.

## Process

1. Reproduce the reported bug. If you cannot reproduce, stop and ask for steps.
2. Locate the root cause (not just the symptom). State the hypothesis.
3. Write or identify a failing test that captures the bug.
4. Apply the minimal fix. Re-run the test; confirm green.
5. Run the surrounding test suite to check for regressions.
6. Ask "Export UT report to file?"; if yes write reports/ut-report-<slug>-<date>.md.

## Anti-rationalization

| Excuse | Reality |
|--------|---------|
| "I see the symptom, patch it." | Patch the root cause, not the symptom. |
| "No test, I verified by hand." | A failing-then-passing test proves the fix and guards regressions. Add it. |

## Red Flags

Symptom-level patches and missing regression tests lead to recurring bugs.

## Verification

A test reproduces the bug and now passes; no regressions.
