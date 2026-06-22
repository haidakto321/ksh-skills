---
agent: 'agent'
description: "Turn an approved spec into a step-by-step build plan. Use when a spec exists and the work needs sequencing before coding."
---

## Overview

Turns an approved spec into a step-by-step build plan with task breakdown and dependencies.

## When to Use

Use this when a spec exists and the work needs sequencing before any coding starts.

## Process

1. Read the approved spec. If none exists, stop and tell the user to run /ksh-spec.
2. Break the work into bite-sized, independently testable tasks (file paths, exact changes, how to test each).
3. Present the plan as plain text in your reply. Do NOT call native plan mode /
   ExitPlanMode here. Native plan-mode approval jumps straight to coding and skips
   steps 4-5 below, so the file export and Decisions & Approvals record never happen.
4. Ask "Export plan to file?" If yes, write docs/plans/<slug>-<date>.md.
   Include a "Decisions & Approvals" section: each question asked at this step,
   the options offered, the option the human chose, and the final approval
   reply - as a history reference for why the plan looks the way it does.
   This question MUST be asked before the approval gate in step 5.
5. GATE (mandatory): only after the export question is answered (and the file
   written if yes), print the task list and wait for explicit approval before
   coding. Do not write any code before this approval.

## Anti-rationalization

| Excuse | Reality |
|--------|---------|
| "Plan in my head is enough." | A written plan is the gate artifact and the executor's map. Write it. |
| "Native plan mode already gave an approve button." | That button jumps straight to coding and skips the export + Decisions record. Present the plan as text and ask the export question first. |

## Red Flags

Spot unestimated tasks and circular dependencies in the plan before execution.

## Verification

An approved task list exists before exit, and the export question was asked before the approval gate.
