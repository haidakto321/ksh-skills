## Overview

The spec step captures WHAT before any planning or coding. A clear written spec is the foundation that prevents rework and aligns the team on success. This skill asks only the essential questions needed to define inputs, outputs, success criteria, and scope boundaries - then drafts a concise spec and gates all downstream work on its approval.

## When to Use

Use this skill when starting a task whose requirements are not yet written down. Whether the task is from a ticket, a verbal request, or a half-formed idea, run `/ksh-spec` to pin down WHAT you are building before committing to a plan or code. A single sentence of WHAT is still cheaper than rework once implementation has started.

## Process

1. Ask only the questions needed to pin down WHAT: purpose, inputs, outputs,
   success criteria, out-of-scope. One question at a time.
2. Draft the spec: Goal, Requirements, Success criteria, Non-goals.
3. Ask "Export spec to file?" If yes, write docs/specs/<slug>-<date>.md
   (<slug> = short kebab task name, <date> = YYYY-MM-DD). Never write silently.
4. GATE (mandatory): print the spec summary, wait for explicit approval of WHAT
   before any planning or code.

## Anti-rationalization

| Excuse | Reality |
|--------|---------|
| "I'll figure out requirements while coding." | Unwritten WHAT causes rework. Pin it first. |
| "The task is obvious, skip the spec." | Obvious to you today may be ambiguous to the reviewer or future maintainer. Write it. |
| "The user will tell me mid-sprint if I got it wrong." | Late discovery costs more than early spec. Confirm WHAT now. |

## Red Flags

- The user cannot articulate success criteria - this signals the task is not yet ready. Stop and clarify what "done" means before drafting the spec.
- The spec has unresolved contradictions (e.g. "must be fast" but "cannot reduce features") - flag these as out-of-scope or constraints, do not paper over them.
- You are tempted to add implementation details (e.g. "use REST API") into the spec - keep WHAT separate from HOW. The plan decides HOW.

## Verification

Before exit, confirm: an approved WHAT exists in written form (whether exported to a file or confirmed in chat), and the human has explicitly approved the spec with "approve", "continue", or equivalent consent. Do not proceed to planning without this gate being honored.
