# ksh-skills

Nine SDLC skills (prefix `ksh`) for a guided spec -> plan -> code -> test ->
review -> security (when triggered) -> doc flow, plus a standalone bug-fix
skill. Human gates at the important steps; evidence reports for tests, review,
and security.

## Skills
- `/ksh` - orchestrator (judges task size, runs the flow with gates)
- `/ksh-spec` `/ksh-plan` `/ksh-code` `/ksh-test` `/ksh-review` `/ksh-security` `/ksh-doc` `/ksh-fix`

## Usage examples

Run a command by typing it in chat (Claude Code or Copilot Chat). Each example
shows what to type and what it does.

| Command | Type this | What happens |
|---------|-----------|--------------|
| `/ksh` | `/ksh add a CSV export button to the report page` | Runs the whole flow. Judges task size, asks to skip steps if trivial, then walks spec -> plan -> code -> test -> review -> security (if the change touches risky surfaces) -> doc with approval gates. Start here if unsure. |
| `/ksh quick` | `/ksh quick fix the typo in the footer copyright year` | Forces the short flow (spec(light) -> code -> test -> light review -> doc). No task-size question. |
| `/ksh full` | `/ksh full build the new billing webhook handler` | Forces all steps with every gate. Use for risky or complex work. |
| `/ksh-spec` | `/ksh-spec a user can reset their password by email` | Asks a few questions, drafts a WHAT spec, offers to save it, waits for your approval. |
| `/ksh-plan` | `/ksh-plan` (after a spec exists) | Turns the approved spec into a step-by-step task list, offers to save it, waits for approval before any code. |
| `/ksh-code` | `/ksh-code` (after a plan is approved) | Implements the plan task by task, surgical edits only, offers a diff review. |
| `/ksh-test` | `/ksh-test` | Detects the stack (npm/pnpm/yarn/bun, maven, gradle, flutter, pytest, go, cargo, dotnet - plus typecheck/lint and Playwright/Cypress at deep level), picks a verification level, runs the checks, auto-fixes up to 2 times, then offers a test evidence report. |
| `/ksh-review` | `/ksh-review` | Reviews the diff, lists findings with HIGH/MED/LOW severity, offers a review report, waits for your fix-vs-merge decision. |
| `/ksh-security` | `/ksh-security` (or `/ksh-security src/auth`) | Audits the diff (or a named module) with STRIDE + OWASP Top 10 checklists, tags findings with severity and a concrete fix, offers a security report, waits for your fix-vs-accept-risk decision. Auto-suggested in the full flow when the change touches auth, payments, user input, secrets, or network-exposed code. |
| `/ksh-doc` | `/ksh-doc` | Captures decisions, tradeoffs, and deviations from the spec into a short notes file. |
| `/ksh-fix` | `/ksh-fix login returns 500 when the email has a plus sign` | Reproduces the bug, finds the root cause, writes a failing test, applies the minimal fix, re-runs tests. |

> Gates are mandatory after spec, plan, and review: the skill stops and waits
> for you to reply "approve" / "continue" before going on. In `/ksh quick` the
> review becomes a fast light pass but the merge gate stays.

## Install

Two tools, one install each:

- **Claude Code** -> pick ONE of Option 1 or Option 2 below (they are
  alternatives, not steps - do not install both).
- **GitHub Copilot** -> see "Install - GitHub Copilot".

### Claude Code, Option 1 - standalone (short names, recommended)

Copies `skills/ksh-*` into `~/.claude/skills/`, where Claude Code picks them up
without a plugin namespace - commands are the short `/ksh`, `/ksh-spec`, ...
forms, exactly as written in the examples above.

```
npx github:haidakto321/ksh-skills --claude
```

Then restart Claude Code (or `/reload`).

- **Update:** rerun the same command anytime - each `ksh-*` skill directory is
  replaced in place.
- **One project only:** `npx github:haidakto321/ksh-skills --claude <project>`
  installs into `<project>/.claude/skills/` instead of your home directory.
- From a local clone the equivalent is `node scripts/install-claude.js`.
- Don't combine with Option 2: if the plugin is also installed, both
  `/ksh-skills:ksh` and `/ksh` show up. Pick one (uninstall the plugin with
  `/plugin uninstall ksh-skills@ksh-skills` to keep only the short names).
- Tradeoff vs the plugin: no marketplace update flow - updating means rerunning
  the npx command.

### Claude Code, Option 2 - plugin (marketplace)

Alternative to Option 1 - only if you prefer the plugin manager over short
names. Skip this if you already ran Option 1.

Claude Code installs plugins through a "marketplace" (this repo ships one in
`.claude-plugin/marketplace.json`). Run these inside Claude Code:

**From GitHub** (after you push this repo):
```
/plugin marketplace add <your-username>/ksh-skills
/plugin install ksh-skills@ksh-skills
```

**From a local clone** (to test before pushing):
```
/plugin marketplace add /d/project-fpt/ksh-skills
/plugin install ksh-skills@ksh-skills
```

Then reload: `/reload-plugins` (or restart Claude Code).

**Note on names:** plugin skills are namespaced by the plugin, so in Claude Code
you invoke them as `/ksh-skills:ksh`, `/ksh-skills:ksh-spec`, etc. For the bare
`/ksh` form shown in the examples use Option 1 (standalone) instead.

## Install - GitHub Copilot (one command)

From the target project's root:

```
npx github:haidakto321/ksh-skills
```

Copies `copilot/.github/**` (prompts, tier agents, web checklists,
copilot-instructions.md) into that project's `.github/`. Then type `/ksh`
in Copilot Chat.

- **Update:** rerun the same command anytime - `ksh-*` and `web-*` files are
  refreshed in place.
- A `copilot-instructions.md` the project already had is kept (merge by hand
  or pass `--force` to replace it).
- Install somewhere else: `npx github:haidakto321/ksh-skills ../myapp`.
- Needs the repo to be public (or your git auth to reach it). From a local
  clone the equivalent is `node scripts/install-copilot.js <target>`.

**Manual fallback:** copy `copilot/.github/prompts/` into the project's
`.github/prompts/`; optionally also `instructions/` (web security / a11y /
perf checklists auto-apply during `/ksh-review`), `agents/`, and
`copilot-instructions.md`.

## Model routing (cheaper model for simple steps)

Each skill has a `weight` (light / normal / heavy) in `shared/frontmatter.json`.

- **Claude Code:** the `/ksh` orchestrator spawns a subagent only when an
  escalation trigger fires (big diff, 2 failed fix attempts, wide exploration)
  and picks the model by weight from the `claude` section of
  `shared/models.json` (default: light -> haiku, normal -> sonnet,
  heavy -> opus). These are aliases: they always resolve to the newest model
  of that tier, so a new Claude release needs no config change here.
  **Short on tokens?** Set `"heavy": "sonnet"` and rebuild - every step then
  runs on Sonnet. If your plan includes the Claude 5 family, `fable` works
  too. (Steps that run inline - the common case - always use your session
  model regardless.)
- **GitHub Copilot:** weights map to Copilot models in the `copilot` section
  of `shared/models.json`. Three pieces:
  1. When `pin: true`, every `ksh-*.prompt.md` pins its tier `model:`, so calling
     a skill directly (e.g. `/ksh-spec`) runs on its tier model - a simple step
     uses a lighter model automatically. When `pin: false` (current default),
     prompts omit `model:` and whichever model you select in the Copilot picker
     runs. See "Choosing the model yourself" below.
  2. Tier agents `copilot/.github/agents/ksh-{light,normal,heavy}.agent.md` each
     pin a model and are handoff targets.
  3. Orchestrator agent `copilot/.github/agents/ksh.agent.md` drives the full
     flow with `handoffs`: a button per step (Spec -> Plan -> ... -> Doc) that
     advances on that step's tier model. `send: false` means each button waits
     for your click - that click IS the human gate.

### Model not in your plan? Use the fallback list

Each weight in `shared/models.json` (`copilot.weights`) is a **prioritized
list**. Copilot tries each model in order and uses the first one available to
you, so a model your org does not have yet (e.g. `Claude Opus 4.8`) is skipped
for the next:

```json
"copilot": {
  "weights": {
    "light":  ["Claude Haiku 4.5", "Gemini 3.5 Flash", "GPT-5.4 mini"],
    "normal": ["Claude Sonnet 5", "Claude Sonnet 4.6", "GPT-5.5", "Gemini 3.1 Pro (Preview)"],
    "heavy":  ["Claude Opus 4.8", "Claude Sonnet 5", "Claude Sonnet 4.6", "GPT-5.5", "Gemini 3.1 Pro (Preview)"]
  }
}
```

> Make the **last entry in each list a model you are certain you have**, so
> routing always resolves. A single string works too, but if that one model is
> unavailable the behavior is undefined.

### Choosing the model yourself

`shared/models.json` has a `pin` flag (under `copilot`):
- `pin: true` - prompts hard-set the tier model list (auto routing).
- `pin: false` (current default) - prompts omit `model:`, so whichever model you
  select in the Copilot model picker runs. Use this if you want to choose per call.

Either way the tier/orchestrator agents keep their model lists (handoffs land on
the tier agent, which carries the fallback). After changing the config, run
`npm run build`.

> The model names shipped are best-effort guesses - replace them with the exact
> strings from your Copilot model picker.

## For maintainers
- Edit source in `shared/` only (`*.body.md`, `frontmatter.json` - including
  each skill's `flow` position, `models.json`, `checklists/`). Never
  hand-edit generated files.
- Run `npm run build` to regenerate `skills/`, `commands/`, `copilot/.github/`,
  AND the root `.github/` (a dogfood mirror of `copilot/.github/` so Copilot
  works inside this repo). Build lints automatically first (via `prebuild`)
  and aborts if the lint fails.
- Bodies may contain `<!-- claude:start -->`/`<!-- claude:end -->` and
  `<!-- copilot:start -->`/`<!-- copilot:end -->` blocks; the build keeps only
  the target tool's blocks in each generated file (saves tokens per invoke).
- Skill changes should be pressure-tested per `TESTING.md` before release.
