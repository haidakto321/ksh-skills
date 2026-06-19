# aisp - SDLC Skill Set: Design Spec

Date: 2026-06-19
Status: Approved design, ready for implementation plan
Repo: ksh-skills
Author: brainstormed with user (kieusonhai07)

## 1. Goal

A small, shareable set of **process skills** that walk a developer through the
SDLC: spec -> plan -> code -> test -> review -> doc, with a standalone bug-fix
skill. Built so a **new team member** can run one command and be guided, and so
it works in **both Claude Code and Copilot CLI** (some projects use one, some the
other).

Reference base: [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)
- borrow its file format, anti-rationalization tables, and verification-gate
style. We keep only 8 dev-focused skills and add human gates + model routing on
top.

Non-goals: deploy / CI / observability / docs-site skills. No web-vs-mobile
split (skills are domain-agnostic, auto-detect stack).

## 2. The skills (8)

Command prefix is `aisp`. The repo that ships them is `ksh-skills`.

| Command | Role | Human gate | Evidence file |
|---------|------|-----------|---------------|
| `/aisp` | Orchestrator. Chains all steps in order, enforces gates, routes to `/aisp-fix` when test loop is stuck | runs every gate below | - |
| `/aisp-spec` | Capture WHAT to build -> write spec file | **mandatory** after (confirm WHAT before HOW) | `docs/specs/<slug>-<date>.md` |
| `/aisp-plan` | Turn spec into a step plan -> write plan file | **mandatory** after | `docs/plans/<slug>-<date>.md` |
| `/aisp-code` | Implement per approved plan. Surgical, follow existing patterns | optional after (diff look) | - |
| `/aisp-test` | Run unit tests + bounded auto-fix loop | optional after | `reports/ut-report-<slug>-<date>.md` |
| `/aisp-review` | Review the diff, findings with severity | **mandatory** (fix vs merge) | `reports/review-<slug>-<date>.md` |
| `/aisp-doc` | Record decisions / ADR / implementation notes at end of flow | - | `docs/notes/<slug>-<date>.md` |
| `/aisp-fix` | Standalone: reproduce -> locate -> fix -> test -> evidence. For a reported bug on existing code | - | `reports/ut-report-<slug>-<date>.md` |

`<slug>` = short kebab-case task name. `<date>` = YYYY-MM-DD. (Matches the user's
existing workflow-export naming rule.)

## 3. Flow (orchestrator `/aisp`)

```
/aisp-spec  -> [GATE: approve WHAT]
/aisp-plan  -> [GATE: approve plan]
/aisp-code
/aisp-test  -> auto-fix loop (below) -> [optional GATE]
/aisp-review-> [GATE: fix vs merge]
/aisp-doc
```

Optional gates (after code, after test) carry the clause:
*"skip if the task is trivial or the user said bypass."*

### 3.1 Skipping steps (task-size aware)

`/aisp` does not blindly run all 8. It judges task size, then **proposes** which
steps to skip and asks the human to confirm (a gate - never skips silently):

- Default `/aisp`: classify task -> if trivial, propose a short flow
  (e.g. "Trivial task. Skip plan and run a light review instead of full? [y/n]")
  -> human confirms -> run the agreed subset.
- Override `/aisp quick`: force the short flow without the size question.
- Override `/aisp full`: force all 8 steps.

**Short / quick flow** = `spec(light) -> code -> test -> light-review -> doc`.
It drops the full *plan* step and swaps the full review for a **light review**
(fast pass, no full report file) but **keeps the merge gate**. Review is never
dropped entirely - it is the cheapest place to catch a bad change.

| Step | Full flow | Short / quick flow |
|------|-----------|--------------------|
| spec | full + gate | light + gate |
| plan | full + gate | skipped |
| code | yes | yes |
| test | full + auto-fix | full + auto-fix |
| review | full + report + gate | light review + gate (no report) |
| doc | yes | yes |

## 4. Test auto-fix loop (inside `/aisp-test`)

```
run unit tests
  -> all green        : write evidence (ask first), continue
  -> fail             : read log -> apply fix -> re-run
       repeat up to 2 attempts
  -> still failing    : STOP, escalate to human, suggest /aisp-fix
```

Bounded at **2 tries** so it cannot spin on a hard bug.

## 5. Human gates - portable mechanism

A gate is plain skill text (works in both tools):

> STOP. Print a short summary of what was produced. Wait for the human to reply
> with explicit approval ("approve" / "continue" / "go"). Do NOT proceed on
> silence or assumption.

Mandatory gates: after spec, after plan, after review.
Optional gates: after code, after test - bypassable for trivial tasks.

## 6. Evidence

- Markdown files under `reports/` (tests, review) and `docs/` (spec, plan, notes).
- **Ask before writing** every report ("Export report to file?") - the user
  flagged report generation as a token cost. Default = ask, never silent-write.
- **Not** git-committed (user rule: never `git add` / `git commit`).
- UT report = raw test output + pass/fail counts + coverage if available.
- Review report = findings with severity (e.g. HIGH/MED/LOW) + fix recommendation.

## 7. Model routing (Claude Code only, graceful degrade)

Heavy steps spawn a subagent with a model picked by task weight. Wrapped in an
`if running in Claude Code:` clause so Copilot ignores it and runs inline.

| Weight | Steps | Model |
|--------|-------|-------|
| light | spec scaffold, simple test | `haiku` |
| normal | code, test | `sonnet` |
| heavy | review, hard debug/fix | `opus` |

Each spawn prints an announce line (`Agent <name> (<model>): <task>`) per the
user's CLAUDE.md rule. Copilot: no subagent, single model, same workflow inline.

## 8. SKILL.md anatomy (per skill, from addyosmani)

```
---
name: aisp-<step>
description: <what it does>. Use when <trigger>.
---

## Overview
## When to Use
## Process            (numbered, the workflow the agent follows)
## Anti-rationalization   (table: excuse -> rebuttal; e.g. "I'll test later" -> no)
## Red Flags
## Verification       (evidence required; "seems right" is rejected)
```

Skills are workflows the agent follows, not reference docs it reads.

## 9. Packaging - two install paths, one repo

Standalone git repo `ksh-skills`:

```
ksh-skills/
  .claude-plugin/plugin.json              # Claude Code plugin manifest
  skills/
    aisp/SKILL.md                         # orchestrator
    aisp-spec/SKILL.md
    aisp-plan/SKILL.md
    aisp-code/SKILL.md
    aisp-test/SKILL.md
    aisp-review/SKILL.md
    aisp-doc/SKILL.md
    aisp-fix/SKILL.md
  .claude/commands/aisp*.md               # Claude slash-command wrappers
  copilot/.github/prompts/aisp-*.prompt.md # Copilot prompt files (copy into a project)
  shared/aisp-*.md                         # the workflow body each format includes
  docs/specs/                              # this design doc lives here
  README.md                                # install guide per tool, new-member quickstart
```

The **workflow body** of each skill is written once in `shared/` and included by
both the SKILL.md (Claude) and the .prompt.md (Copilot). Only the thin frontmatter
wrapper differs per tool. 8 skills = 8 bodies + 16 thin wrappers.

### Install path A - Claude Code (plugin)
Install `ksh-skills` as a plugin once per machine; `/aisp*` is then available in
every project. Manifest (`.claude-plugin/plugin.json`):
```json
{
  "name": "ksh-skills",
  "version": "0.1.0",
  "description": "aisp SDLC skill set",
  "author": "haiks",
  "minClaudeVersion": "1.0"
}
```

### Install path B - GitHub Copilot (copy, no install)
Copy `copilot/.github/prompts/aisp-*.prompt.md` into the target project's
`.github/prompts/` folder. No plugin install. `/aisp*` then works in that
project's Copilot Chat. Optionally also copy a `.github/copilot-instructions.md`
for always-on guidance.

Portability: skill bodies are plain markdown with no hard dependency on
Claude-only tools in the required path. Claude-only optimizations (model routing)
sit behind `if Claude Code:` clauses, which Copilot ignores.

## 10. Open items for the plan

1. Confirm GitHub Copilot `.prompt.md` frontmatter fields (mode / model / tools /
   description) and that `/`-invocation discovers them from `.github/prompts/`.
2. Stack auto-detect matrix: package.json / pom.xml / build.gradle / pubspec.yaml
   -> test + build commands.
3. New-member README quickstart wording (both install paths).
4. How `shared/` bodies are included by each wrapper (literal include vs copy at
   build) - pick the simplest that both tools render.
