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
| `/ksh-test` | `/ksh-test` | Detects the stack (npm / maven / gradle / flutter), runs unit tests, auto-fixes up to 2 times, then offers a test evidence report. |
| `/ksh-review` | `/ksh-review` | Reviews the diff, lists findings with HIGH/MED/LOW severity, offers a review report, waits for your fix-vs-merge decision. |
| `/ksh-security` | `/ksh-security` (or `/ksh-security src/auth`) | Audits the diff (or a named module) with STRIDE + OWASP Top 10 checklists, tags findings with severity and a concrete fix, offers a security report, waits for your fix-vs-accept-risk decision. Auto-suggested in the full flow when the change touches auth, payments, user input, secrets, or network-exposed code. |
| `/ksh-doc` | `/ksh-doc` | Captures decisions, tradeoffs, and deviations from the spec into a short notes file. |
| `/ksh-fix` | `/ksh-fix login returns 500 when the email has a plus sign` | Reproduces the bug, finds the root cause, writes a failing test, applies the minimal fix, re-runs tests. |

> Gates are mandatory after spec, plan, and review: the skill stops and waits
> for you to reply "approve" / "continue" before going on. In `/ksh quick` the
> review becomes a fast light pass but the merge gate stays.

## Install A - Claude Code (plugin, once per machine)

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
you invoke them as `/ksh-skills:ksh`, `/ksh-skills:ksh-spec`, etc. The bare
`/ksh` form shown in the examples is how it reads in GitHub Copilot (Install B).

## Install B - GitHub Copilot (copy into a project, no install)
1. Copy `copilot/.github/prompts/ksh-*.prompt.md` into your project's
   `.github/prompts/` folder.
2. (Optional) copy `copilot/.github/copilot-instructions.md` into your
   project's `.github/`.
3. In that project, type `/ksh` in Copilot Chat.

## Model routing (cheaper model for simple steps)

Each skill has a `weight` (light / normal / heavy) in `shared/frontmatter.json`.

- **Claude Code:** the `/ksh` orchestrator spawns a subagent only when an
  escalation trigger fires (big diff, 2 failed fix attempts, wide exploration)
  and picks the model by weight (light -> haiku, normal -> sonnet,
  heavy -> opus). These are aliases: they always resolve to the newest model
  of that tier, so a new Claude release needs no config change here.
- **GitHub Copilot:** weights map to Copilot models in
  `shared/copilot-models.json`. Three pieces:
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

Each weight in `shared/copilot-models.json` is a **prioritized list**. Copilot
tries each model in order and uses the first one available to you, so a model
your org does not have yet (e.g. `Claude Opus 4.8`) is skipped for the next:

```json
"weights": {
  "light":  ["Claude Haiku 4.5", "Gemini 3.5 Flash", "GPT-5.4 mini"],
  "normal": ["Claude Sonnet 5", "Claude Sonnet 4.6", "GPT-5.5", "Gemini 3.1 Pro (Preview)"],
  "heavy":  ["Claude Opus 4.8", "Claude Sonnet 5", "Claude Sonnet 4.6", "GPT-5.5", "Gemini 3.1 Pro (Preview)"]
}
```

> Make the **last entry in each list a model you are certain you have**, so
> routing always resolves. A single string works too, but if that one model is
> unavailable the behavior is undefined.

### Choosing the model yourself

`shared/copilot-models.json` has a `pin` flag:
- `pin: true` - prompts hard-set the tier model list (auto routing).
- `pin: false` (current default) - prompts omit `model:`, so whichever model you
  select in the Copilot model picker runs. Use this if you want to choose per call.

Either way the tier/orchestrator agents keep their model lists (handoffs land on
the tier agent, which carries the fallback). After changing the config, run
`npm run build`.

> The model names shipped are best-effort guesses - replace them with the exact
> strings from your Copilot model picker.

## For maintainers
- Edit source in `shared/` only (`*.body.md`, `frontmatter.json`,
  `copilot-models.json`). Never hand-edit generated files.
- Run `npm run build` to regenerate `skills/`, `commands/`, and
  `copilot/.github/`. Build lints automatically first (via `prebuild`) and
  aborts if the lint fails.
