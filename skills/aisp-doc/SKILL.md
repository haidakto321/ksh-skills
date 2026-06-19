---
name: aisp-doc
description: "Record decisions, tradeoffs and implementation notes after work is done. Use when capturing the why at the end of a task."
---

## Overview

Records decisions, tradeoffs and implementation notes after work is done.

## When to Use

Use when capturing the why at the end of a task and explaining deviations from spec.

## Process

1. Gather what changed vs the spec/plan: decisions made that were not in the
   spec, things changed, tradeoffs, anything the team should know.
2. Ask "Export doc/notes to file?" If yes, write docs/notes/<slug>-<date>.md.
3. Keep it short and factual. Link the spec, plan, and any reports.

## Anti-rationalization

| Excuse | Reality |
|--------|---------|
| "The code is self-documenting." | Decisions and tradeoffs are not in the diff. Record the why. |

## Red Flags

Unrecorded tradeoffs and decisions made outside the spec become tribal knowledge.

## Verification

Decisions and tradeoffs captured if any were made.
