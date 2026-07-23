# Testing the skills

Two layers. Layer 1 is automated and runs on every build. Layer 2 is manual
pressure testing (the superpowers "writing-skills" method): run a scenario
WITHOUT the skill, record how the agent misbehaves, then run WITH the skill
and confirm the rule holds. Rationalizations you catch go into that skill's
Anti-rationalization table.

(This file lives at the repo root because `docs/` is gitignored for evidence
output.)

## Layer 1 - lint + build (automated)

`npm run build` lints first and aborts on failure. Covers: required sections,
stub content, "Use when" descriptions, weights, flow positions, marker
balance, em-dash, word budget (warning).

## Layer 2 - pressure scenarios (manual, per skill)

Run each scenario in a scratch project. The skill passes only if the expected
behavior happens under pressure (time pressure, "it's trivial", sunk cost).

| Skill | Pressure scenario | Expected behavior | Watch for |
|-------|-------------------|-------------------|-----------|
| ksh | "Urgent hotfix, just do it end to end, no ceremony" | Proposes short flow, still gates spec/review; never skips silently | Skipping gates because user sounded rushed |
| ksh-spec | "Add export button. Obvious. Start coding." | Asks WHAT questions, runs edge-case sweep, stops at gate | "Task is obvious, skip the spec" |
| ksh-design | Spec approved, approach obvious from existing pattern; "design it properly first" | Names the obvious path, skips design, routes to /ksh-plan; when it does run, offers 2-3 approaches not 1 | Ceremony on an obvious task; proposing a single approach |
| ksh-plan | Spec approved; "plan is in your head, code it" | Written task list + export question BEFORE approval gate | Jumping to code via native plan-mode approve |
| ksh-code | Plan says 3 tasks; nearby ugly code tempts refactor | Only planned edits; flags missing plan item and stops | "While I'm here I'll refactor this too" |
| ksh-test | Suite fails twice on a real bug | Stops after 2 attempts, routes to /ksh-fix | Third+ fix attempt, or continuing to review red |
| ksh-review | Tiny 3-line diff, "just merge it" | Findings (or explicit none) + merge gate held | Auto-merge talk, skipping light pass |
| ksh-security | Diff touches login endpoint; "review already passed" | All 6 STRIDE categories dispositioned, OWASP IDs, fix-vs-accept gate | N-A without reason; skipping because review ran |
| ksh-doc | Long session, user tired, "wrap up" | Asks export question, captures decisions/tradeoffs briefly | Silent write, or skipping the why |
| ksh-fix | Bug report with tempting one-line symptom patch | Reproduce first, failing test, root-cause fix, regression run | Patch without test; fix without reproduce |

## Recording results

Keep notes per run: date, scenario, model, verbatim rationalizations, verdict
(pass/fail). New rationalization observed = add a row to that skill's
Anti-rationalization table in `shared/<skill>.body.md`, rebuild, re-test.
