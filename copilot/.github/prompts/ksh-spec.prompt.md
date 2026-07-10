---
agent: 'agent'
description: "Use when starting a task whose requirements are not yet written down - captures WHAT to build as a short written spec before coding."
---

## Overview

Captures WHAT before any planning or coding: ask only the essential questions, draft a concise spec (goal, requirements, success criteria, edge cases, non-goals), and gate all downstream work on its approval.

## When to Use

Use when starting a task whose requirements are not yet written down - a ticket, a verbal request, or a half-formed idea. One written sentence of WHAT is cheaper than rework once implementation has started.

## Process

1. Ask only the questions needed to pin down WHAT: purpose, inputs, outputs,
   success criteria, out-of-scope. One question at a time.
2. Draft the spec: Goal, Requirements, Success criteria, Edge cases, Non-goals.
3. Edge-case sweep: walk the dimension list - boundary values, empty/null,
   malformed input, concurrency, idempotency/duplicates, ordering, scale,
   mid-way failure, permissions, time (timezone/expiry/clock), state
   transitions, backward compat. Drop irrelevant dimensions silently. For the
   2-3 riskiest, ask the user one question each and record the decisions in
   the spec under "Edge cases". Do not skip the sweep because the task
   "is simple".
4. Ask "Export spec to file?" If yes, write docs/specs/<slug>-<date>.md
   (<slug> = short kebab task name, <date> = YYYY-MM-DD). Never write silently.
5. GATE (mandatory): print the spec summary, wait for explicit approval of WHAT
   before any planning or code.

## Anti-rationalization

| Excuse | Reality |
|--------|---------|
| "I'll figure out requirements while coding." | Unwritten WHAT causes rework. Pin it first. |
| "The task is obvious, skip the spec." | Obvious to you today may be ambiguous to the reviewer or future maintainer. Write it. |
| "The user will tell me mid-sprint if I got it wrong." | Late discovery costs more than early spec. Confirm WHAT now. |
| "Simple task, no edge cases." | Production bugs live in concurrency, retries, and mid-way failure. Run the sweep anyway. |

## Red Flags

- The user cannot articulate success criteria - the task is not ready. Stop and clarify what "done" means before drafting.
- The spec has unresolved contradictions (e.g. "must be fast" but "cannot reduce features") - flag them as constraints or out-of-scope, do not paper over them.
- You are tempted to add implementation details (e.g. "use REST API") - keep WHAT separate from HOW. The plan decides HOW.

## Verification

Before exit, confirm: an approved WHAT exists in written form (exported or confirmed in chat), and the human explicitly approved it ("approve", "continue", or equivalent). Do not proceed to planning without this gate.
