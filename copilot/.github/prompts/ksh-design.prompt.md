---
agent: 'agent'
description: "Use when a spec is approved but the approach is non-obvious - explores context, weighs 2-3 approaches with trade-offs, and records a short design doc before planning. Skipped when one approach is obvious."
---

## Overview

A conditional HOW-design step between spec and plan. When the approach is not obvious, it explores the relevant context, proposes 2-3 approaches with trade-offs, picks one with the human, and records a short design doc - so the plan sequences a chosen architecture instead of a guessed one. Skipped when a single approach is dictated by existing patterns.

## When to Use

Use after the spec is approved and before planning, but only when the approach is non-obvious. Fire on any of: more than one viable approach, a new subsystem/module/integration, an architectural or cross-cutting choice (data model, async vs sync, storage, a hard-to-reverse public contract), or a structural change crossing several layers. Skip when one path is obvious from existing patterns - say so and go straight to /ksh-plan.

## Process

1. Trigger check (self-guard): confirm at least one trigger applies. If none,
   STOP - state "approach obvious, follows <pattern>" and return to /ksh-plan.
   Do not run design on a task with one obvious path.
2. Explore only the context the decision needs - existing patterns, constraints,
   affected modules. Read-only; keep it scoped to the choice at hand.
3. Clarify only genuinely-open design questions, one at a time. If nothing is
   open, go straight to approaches.
4. Propose 2-3 approaches. For each, give trade-offs across cost, complexity,
   risk, and reversibility. Lead with a recommendation and the reason for it.
   Naming the rejected options and why is the point - do not offer just one.
5. Draft the design doc, sections scaled to complexity: Chosen approach,
   Architecture/components, Data flow, Error handling, Testing, Rejected
   alternatives (and why). Keep it architecture-level, not code. Self-review
   inline for placeholders, contradictions, scope creep, and ambiguity - fix
   in place.
6. Ask "Export design to file?" If yes, write docs/designs/<slug>-<date>.md
   (<slug> = short kebab task name, <date> = YYYY-MM-DD). Never write silently.
7. GATE (mandatory when design runs): print the design summary, wait for
   explicit approval of HOW before any planning or code.

## Anti-rationalization

| Excuse | Reality |
|--------|---------|
| "I'll pick the approach while coding." | An approach chosen mid-code becomes rework when it hits a wall. Decide HOW first. |
| "Run design on every task to be safe." | Design on an obvious task is pure ceremony and wasted tokens. Skip when existing patterns dictate the path. |
| "One approach is enough." | Naming 2-3 forces the trade-off you are skipping. The rejected options and their reasons are the value. |
| "The design can hold the final code." | That is /ksh-code. Keep design at architecture level or the gate reviews the wrong thing. |

## Red Flags

- All approaches collapse to the same thing - the choice was obvious, you should have skipped design.
- The design re-opens WHAT (goal, requirements) - that is /ksh-spec's job, not this step.
- The design drifts into pseudocode or final implementation - pull back to architecture level.
- No trigger actually applied but you ran anyway - you are ceremony-izing a trivial task.

## Verification

Before exit, confirm: at least one trigger justified running (or you correctly skipped and said so), a chosen approach with named rejected alternatives exists in written form (exported or in chat), and the human explicitly approved HOW before planning. Without an approved approach, do not proceed to /ksh-plan.
