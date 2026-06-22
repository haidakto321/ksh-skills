---
agent: 'agent'
model: ["Claude Sonnet 4.6","GPT-4.1"]
description: "Orchestrate the full SDLC flow (spec, plan, code, test, review, doc) with human gates. Use when a developer wants guided end-to-end delivery of a task or feature."
---

## Overview

The ksh orchestrator guides you through the full SDLC flow in a structured, human-gated pipeline. It judges task size and proposes a short flow for small changes, or runs the full flow for complex work. Human approval is required at the important gates - after spec, after plan, and after review - to keep stakeholders in the loop and prevent rework.

## When to Use

Use this skill when you want guided end-to-end delivery of a task or feature. It combines spec capture, planning, implementation, testing, review, and documentation into one orchestrated flow with human gates and optional evidence reports. Start here if you are not sure which step to run next.

## Process

### Modes
- `/ksh` (default): judge task size first. If trivial, PROPOSE a short flow
  and ask the human to confirm before running it. Never skip silently.
- `/ksh quick`: force the short flow (no size question).
- `/ksh full`: force all steps.

Full flow:  spec -> [GATE] -> plan -> [GATE] -> code -> test -> [opt GATE] -> review -> [GATE] -> doc
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

### Model routing by task weight
Each skill has a weight: light (spec, doc), normal (plan, code, test), heavy
(review, fix).
- In Claude Code: dispatch heavy steps to a subagent with a model by weight -
  light -> haiku, normal -> sonnet, heavy -> opus. Print an announce line
  `Agent <name> (<model>): <task>` per spawn. If running inline, skip routing.
- In GitHub Copilot: each atomic skill prompt already pins its tier model
  (`model:` in its .prompt.md). For the full flow, hand off heavy steps to the
  `ksh-heavy` custom agent and light steps to `ksh-light` (each agent pins its
  model in copilot/.github/agents/). Tier models are configured in
  shared/copilot-models.json.

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
