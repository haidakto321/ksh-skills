---
name: ksh
description: "Use when a developer wants guided end-to-end delivery of a task or feature - orchestrates the SDLC flow with human approval gates. Start here if unsure which step to run."
---

## Overview

Guides the SDLC as a human-gated pipeline: judge task size, then run the short flow for small changes or the full flow for complex work. Human approval is mandatory at every gate.

## When to Use

Use when you want guided end-to-end delivery of a task or feature. Start here if unsure which step to run next.

## Process

### Modes
- `/ksh` (default): judge task size first. If trivial, PROPOSE the short flow
  and ask the human to confirm first. Never skip silently.
- `/ksh quick`: force the short flow (no size question).
- `/ksh full`: force all steps.

Full flow:  spec -> design(if triggers) -> plan -> code -> test -> review -> security(if triggers) -> doc
Short flow: spec(light) -> code -> test -> light review -> [GATE] -> doc

### Human gate (apply at every GATE)
STOP. Print a short summary of what was produced. Wait for explicit human
approval ("approve" / "continue" / "go"); do NOT proceed on silence or
assumption. Mandatory gates: after spec, design (when it runs), plan, review.
Optional gates (after code, test): skip only if trivial or the user said bypass.

### Design step (conditional)
After the spec gate, run /ksh-design when the approach is non-obvious:
multiple viable approaches, a new subsystem/integration, an architectural or
cross-cutting choice (data model, sync boundary, storage, a hard-to-reverse
contract), or a structural change crossing layers. Otherwise skip it and say
so. Short flow never runs it; when it does, its gate before plan is mandatory.

### Test escalation
If /ksh-test exhausts its 2 fix attempts, STOP and route to /ksh-fix; do not
continue to review with failing tests.

### Security step (conditional)
After the review gate passes, run /ksh-security when the change touches
auth/session logic, payments, file upload, raw user input, secrets/crypto, or
a network-exposed surface. Otherwise skip it and say so. The short flow never
auto-runs it; suggest it if a trigger clearly applies.

### Inline-first escalation policy
Run every step inline by default. Spawn a subagent ONLY when a trigger fires:
- review / security: the diff touches > 5 files or > 300 changed lines
- fix: 2 inline fix attempts failed (spawn a fresh-context fixer)
- exploration: answering a question needs scanning > 5 files (read-only)
Below threshold: stay inline, skip model routing. Each spawn prints
`Agent <name> (<model>): <task>, est ~Nk tokens` (an estimate, never measured).

### Model routing by task weight
Each skill has a weight in shared/frontmatter.json (light/normal/heavy).
When the escalation policy says spawn, pick the subagent model by weight -
light -> haiku, normal -> sonnet, heavy ->
opus (configured in shared/models.json; aliases track each tier's
latest model). Inline runs skip routing; the human can override the model at
any gate.

## Anti-rationalization

| Excuse | Reality |
|--------|---------|
| "Task is small, skip the spec." | One sentence of WHAT beats rework. Write it. |
| "Skip the gate, I know it is right." | The human owns the gate. Stop and ask. |
| "Tests fail but the change looks fine." | Failing tests block review. Fix or route to /ksh-fix. |

## Red Flags

Watch for scope creep during code, hidden plan dependencies, and skipped gates. If the human goes silent at a gate, ask again - silence is not approval. Escalate flaky tests that spin the auto-fix loop to /ksh-fix, do not retry forever.

## Verification

Exit only when every mandatory gate was honored with explicit human approval and the test step ended green or escalated to /ksh-fix. A skipped gate fails validation.
