# ksh-skills

Eight SDLC skills (prefix `aisp`) for a guided spec -> plan -> code -> test ->
review -> doc flow, plus a standalone bug-fix skill. Human gates at the
important steps; evidence reports for tests and review.

## Skills
- `/aisp` - orchestrator (judges task size, runs the flow with gates)
- `/aisp-spec` `/aisp-plan` `/aisp-code` `/aisp-test` `/aisp-review` `/aisp-doc` `/aisp-fix`

## Usage examples

Run a command by typing it in chat (Claude Code or Copilot Chat). Each example
shows what to type and what it does.

| Command | Type this | What happens |
|---------|-----------|--------------|
| `/aisp` | `/aisp add a CSV export button to the report page` | Runs the whole flow. Judges task size, asks to skip steps if trivial, then walks spec -> plan -> code -> test -> review -> doc with approval gates. Start here if unsure. |
| `/aisp quick` | `/aisp quick fix the typo in the footer copyright year` | Forces the short flow (spec(light) -> code -> test -> light review -> doc). No task-size question. |
| `/aisp full` | `/aisp full build the new billing webhook handler` | Forces all steps with every gate. Use for risky or complex work. |
| `/aisp-spec` | `/aisp-spec a user can reset their password by email` | Asks a few questions, drafts a WHAT spec, offers to save it, waits for your approval. |
| `/aisp-plan` | `/aisp-plan` (after a spec exists) | Turns the approved spec into a step-by-step task list, offers to save it, waits for approval before any code. |
| `/aisp-code` | `/aisp-code` (after a plan is approved) | Implements the plan task by task, surgical edits only, offers a diff review. |
| `/aisp-test` | `/aisp-test` | Detects the stack (npm / maven / gradle / flutter), runs unit tests, auto-fixes up to 2 times, then offers a test evidence report. |
| `/aisp-review` | `/aisp-review` | Reviews the diff, lists findings with HIGH/MED/LOW severity, offers a review report, waits for your fix-vs-merge decision. |
| `/aisp-doc` | `/aisp-doc` | Captures decisions, tradeoffs, and deviations from the spec into a short notes file. |
| `/aisp-fix` | `/aisp-fix login returns 500 when the email has a plus sign` | Reproduces the bug, finds the root cause, writes a failing test, applies the minimal fix, re-runs tests. |

> Gates are mandatory after spec, plan, and review: the skill stops and waits
> for you to reply "approve" / "continue" before going on. In `/aisp quick` the
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
you invoke them as `/ksh-skills:aisp`, `/ksh-skills:aisp-spec`, etc. The bare
`/aisp` form shown in the examples is how it reads in GitHub Copilot (Install B).

## Install B - GitHub Copilot (copy into a project, no install)
1. Copy `copilot/.github/prompts/aisp-*.prompt.md` into your project's
   `.github/prompts/` folder.
2. (Optional) copy `copilot/.github/copilot-instructions.md` into your
   project's `.github/`.
3. In that project, type `/aisp` in Copilot Chat.

## Model routing (cheaper model for simple steps)

Each skill has a `weight` (light / normal / heavy) in `shared/frontmatter.json`.

- **Claude Code:** the `/aisp` orchestrator spawns a subagent per heavy step with
  a model by weight (light -> haiku, normal -> sonnet, heavy -> opus). Dynamic,
  per-step.
- **GitHub Copilot:** weights map to Copilot models in
  `shared/copilot-models.json`. Three pieces:
  1. Every `aisp-*.prompt.md` pins its tier `model:`, so calling a skill directly
     (e.g. `/aisp-spec`) runs on its tier model - a simple step uses a lighter
     model automatically.
  2. Tier agents `copilot/.github/agents/aisp-{light,normal,heavy}.agent.md` each
     pin a model and are handoff targets.
  3. Orchestrator agent `copilot/.github/agents/aisp.agent.md` drives the full
     flow with `handoffs`: a button per step (Spec -> Plan -> ... -> Doc) that
     advances on that step's tier model. `send: false` means each button waits
     for your click - that click IS the human gate.

### Model not in your plan? Use the fallback list

Each weight in `shared/copilot-models.json` is a **prioritized list**. Copilot
tries each model in order and uses the first one available to you, so a model
your org does not have (e.g. `Claude Opus 4.8`) is skipped for the next:

```json
"weights": {
  "light":  ["GPT-5 mini", "GPT-4.1"],
  "normal": ["Claude Sonnet 4.6", "GPT-4.1"],
  "heavy":  ["Claude Opus 4.8", "Claude Sonnet 4.6", "GPT-4.1"]
}
```

> Make the **last entry in each list a model you are certain you have**, so
> routing always resolves. A single string works too, but if that one model is
> unavailable the behavior is undefined.

### Choosing the model yourself

`shared/copilot-models.json` has a `pin` flag:
- `pin: true` (default) - prompts hard-set the tier model list (auto routing).
- `pin: false` - prompts omit `model:`, so whichever model you select in the
  Copilot model picker runs. Use this if you want to choose per call.

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
