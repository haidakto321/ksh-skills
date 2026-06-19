## Overview

Turns an approved spec into a step-by-step build plan with task breakdown and dependencies.

## When to Use

Use this when a spec exists and the work needs sequencing before any coding starts.

## Process

1. Read the approved spec. If none exists, stop and tell the user to run /aisp-spec.
2. Break the work into bite-sized, independently testable tasks (file paths, exact changes, how to test each).
3. Ask "Export plan to file?" If yes, write docs/plans/<slug>-<date>.md.
4. GATE (mandatory): print the task list, wait for explicit approval before coding.

## Anti-rationalization

| Excuse | Reality |
|--------|---------|
| "Plan in my head is enough." | A written plan is the gate artifact and the executor's map. Write it. |

## Red Flags

Spot unestimated tasks and circular dependencies in the plan before execution.

## Verification

An approved task list exists before exit.
