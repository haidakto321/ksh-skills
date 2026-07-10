---
name: ksh
description: "Use when a developer wants guided end-to-end delivery of a task or feature - orchestrates the SDLC flow with human approval gates. Start here if unsure which step to run."
---

## Overview

Guides the full SDLC as a human-gated pipeline: judge task size, then run the short flow for small changes or the full flow for complex work. Human approval is mandatory after spec, after plan, and after review.

## When to Use

Use when you want guided end-to-end delivery of a task or feature. Start here if you are not sure which step to run next.

## Process

### Modes
- `/ksh` (default): judge task size first. If trivial, PROPOSE a short flow
  and ask the human to confirm before running it. Never skip silently.
- `/ksh quick`: force the short flow (no size question).
- `/ksh full`: force all steps.

Full flow:  spec -> [GATE] -> plan -> [GATE] -> code -> test -> [opt GATE] -> review -> [GATE] -> security(if triggers) -> doc
Short flow: spec(light) -> code -> test -> light review -> [GATE] -> doc

### Human gate (apply at every GATE)
STOP. Print a short summary of what was produced. Wait for the human to reply
with explicit approval ("approve" / "continue" / "go"). Do NOT proceed on
silence or assumption. Mandatory gates: after spec, after plan, after review.
Optional gates (after code, after test): skip only if the task is trivial or
the user said bypass.

### Test escalation
If /ksh-test exhausts its 2 fix attempts, STOP and route to /ksh-fix; do not
continue to review with failing tests.

### Security step (conditional)
After the review gate passes, run /ksh-security when the change touches any
of: auth/session logic, payments, file upload, raw user input parsing,
secrets or crypto, or a network-exposed surface. Otherwise skip it and say
so. The short flow never auto-runs it; suggest it if a trigger clearly
applies.

### Inline-first escalation policy
Run every step inline in the main context by default. Spawn a subagent ONLY
when a trigger fires:
- review / security: the diff touches > 5 files or > 300 changed lines
- fix: 2 inline fix attempts failed (spawn a fresh-context fixer)
- exploration: answering a question needs scanning > 5 files (read-only)
Below every threshold: stay inline and skip model routing. Each spawn prints
`Agent <name> (<model>): <task>, est ~Nk tokens` (token figure is an
estimate, never a measured count).

### Model routing by task weight
Each skill has a weight in shared/frontmatter.json: light (doc), normal
(plan, code, test), heavy (spec, review, security, fix).
When the escalation policy says spawn, pick the subagent model by weight -
light -> haiku, normal -> sonnet, heavy ->
opus (configured in shared/models.json; aliases track each
tier's latest model). Inline runs skip routing. The human can override the
model for any step at a gate.

## Anti-rationalization

| Excuse | Reality |
|--------|---------|
| "Task is small, skip the spec." | One sentence of WHAT is still cheaper than rework. Write it. |
| "Skip the gate, I know it is right." | The human owns the gate. Stop and ask. |
| "Tests fail but the change looks fine." | Failing tests block review. Fix or route to /ksh-fix. |

## Red Flags

Watch for scope creep during code, hidden dependencies in the plan, and skipped gates. If the human goes silent at a gate, pause and ask again - silence does not mean approval. Flaky tests that spin the auto-fix loop should be escalated to /ksh-fix, not retried forever.

## Verification

Exit only when every mandatory gate was honored (explicit human approval after spec, after plan, after review) and the test step ended either green or escalated to /ksh-fix. If you skipped a gate, validation fails.
