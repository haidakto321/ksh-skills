---
agent: 'agent'
description: "Use when a plan is approved and code must be written - implements it surgically, following existing patterns."
---

## Overview

Implements code following an approved plan with surgical edits matching existing patterns and style.

## When to Use

Use when a plan is approved and code must be written without inventing scope.

## Process

1. Follow the approved plan task by task. Make surgical edits; match existing code style, naming and patterns. No unrelated refactor.
2. Do not invent scope beyond the plan. If a needed change is missing from the plan, stop and flag it.
3. Optional GATE after a coherent change: offer a diff review. Skip if the task is trivial or the user said bypass.
4. Hand off to /ksh-test.

## Anti-rationalization

| Excuse | Reality |
|--------|---------|
| "While I'm here I'll refactor this too." | Scope creep breaks the plan-gate contract. Stay in scope. |

## Red Flags

Unplanned refactoring and feature creep during implementation require stopping to re-plan.

## Verification

Changes map to plan tasks; no out-of-scope edits.
