# aisp SDLC Skill Set Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `ksh-skills` repo - 8 markdown SDLC skills (prefix `aisp`) that install as a Claude Code plugin and copy into a project for GitHub Copilot, with human gates, a bounded test auto-fix loop, evidence reports, and Claude-only model routing.

**Architecture:** Single source of truth per skill in `shared/aisp-*.body.md`. A small Node build script wraps each body with tool-specific frontmatter to generate the Claude `SKILL.md` files and the Copilot `.prompt.md` files. A lint script enforces required frontmatter + sections. No app code - the deliverable is markdown + two small Node scripts.

**Tech Stack:** Markdown, JSON (plugin manifest), Node.js (build + lint scripts, no deps), Git Bash on Windows.

## Global Constraints

- Command prefix: `aisp`. Skills: `aisp`, `aisp-spec`, `aisp-plan`, `aisp-code`, `aisp-test`, `aisp-review`, `aisp-doc`, `aisp-fix`.
- Plugin manifest values: name `ksh-skills`, version `0.1.0`, author `haiks`, minClaudeVersion `1.0`.
- Test auto-fix loop bound: **2 attempts** then escalate.
- Evidence reports: **ask before writing**, never silent. Not git-committed by the skills themselves.
- Mandatory gates: after spec, after plan, after review. Optional gates: after code, after test (bypass on trivial).
- Quick/short flow keeps a **light review** + merge gate; review is never dropped fully.
- Model routing is Claude-only, behind `if Claude Code:`; Copilot runs inline.
- Never use the `-` em-dash character in any output; use a plain hyphen.
- Each `SKILL.md` body must contain these sections in order: `Overview`, `When to Use`, `Process`, `Anti-rationalization`, `Red Flags`, `Verification`.
- Frontmatter on every skill: `name`, `description` (ending with `Use when ...`).

## File Structure

```
ksh-skills/
  .claude-plugin/plugin.json
  skills/aisp/SKILL.md                       # generated
  skills/aisp-{spec,plan,code,test,review,doc,fix}/SKILL.md   # generated
  .claude/commands/aisp.md                   # generated slash wrappers
  .claude/commands/aisp-*.md                 # generated
  copilot/.github/prompts/aisp.prompt.md     # generated
  copilot/.github/prompts/aisp-*.prompt.md   # generated
  copilot/.github/copilot-instructions.md    # hand-written, always-on note
  shared/aisp.body.md                         # source of truth (orchestrator)
  shared/aisp-*.body.md                        # source of truth (7 steps)
  shared/frontmatter.json                      # name+description per skill
  scripts/build.js                             # body + frontmatter -> outputs
  scripts/lint.js                              # validate bodies + generated files
  docs/specs/2026-06-19-aisp-sdlc-skill-set-design.md   # exists
  docs/plans/2026-06-19-aisp-sdlc-skill-set.md          # this file
  README.md
  package.json                                 # npm run build / npm run lint
```

Source of truth = `shared/`. Everything under `skills/`, `.claude/commands/`, `copilot/.github/prompts/` is **generated** by `scripts/build.js`. Never hand-edit generated files.

---

### Task 1: Repo scaffold + plugin manifest + npm scripts

**Files:**
- Create: `.claude-plugin/plugin.json`
- Create: `package.json`
- Create: `.gitignore`

**Interfaces:**
- Produces: `npm run build` and `npm run lint` script names used by every later task.

- [ ] **Step 1: Write `.claude-plugin/plugin.json`**

```json
{
  "name": "ksh-skills",
  "version": "0.1.0",
  "description": "aisp SDLC skill set: spec, plan, code, test, review, doc, fix with human gates and evidence",
  "author": "haiks",
  "minClaudeVersion": "1.0"
}
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "ksh-skills",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "node scripts/build.js",
    "lint": "node scripts/lint.js"
  }
}
```

- [ ] **Step 3: Write `.gitignore`**

```
node_modules/
reports/
```

- [ ] **Step 4: Verify JSON is valid**

Run: `node -e "require('./.claude-plugin/plugin.json'); require('./package.json'); console.log('ok')"`
Expected: prints `ok`

- [ ] **Step 5: Commit**

```bash
git add .claude-plugin/plugin.json package.json .gitignore
git commit -m "chore: scaffold ksh-skills repo and plugin manifest"
```

---

### Task 2: Frontmatter map + lint script

**Files:**
- Create: `shared/frontmatter.json`
- Create: `scripts/lint.js`

**Interfaces:**
- Produces: `shared/frontmatter.json` shape `{ "<skill>": { "name": str, "description": str } }`, consumed by `build.js` (Task 3) and `lint.js`.
- Produces: `lint.js` checks every `shared/*.body.md` has the 6 required sections and a matching frontmatter entry.

- [ ] **Step 1: Write `shared/frontmatter.json`**

```json
{
  "aisp": { "name": "aisp", "description": "Orchestrate the full SDLC flow (spec, plan, code, test, review, doc) with human gates. Use when a developer wants guided end-to-end delivery of a task or feature." },
  "aisp-spec": { "name": "aisp-spec", "description": "Capture WHAT to build as a short written spec before coding. Use when starting a task whose requirements are not yet written down." },
  "aisp-plan": { "name": "aisp-plan", "description": "Turn an approved spec into a step-by-step build plan. Use when a spec exists and the work needs sequencing before coding." },
  "aisp-code": { "name": "aisp-code", "description": "Implement code per an approved plan, surgically and following existing patterns. Use when a plan is approved and code must be written." },
  "aisp-test": { "name": "aisp-test", "description": "Run unit tests with a bounded auto-fix loop and write evidence. Use when verifying behavior after a code change." },
  "aisp-review": { "name": "aisp-review", "description": "Review the diff for bugs and quality with severity-tagged findings. Use when gating a change before merge." },
  "aisp-doc": { "name": "aisp-doc", "description": "Record decisions, tradeoffs and implementation notes after work is done. Use when capturing the why at the end of a task." },
  "aisp-fix": { "name": "aisp-fix", "description": "Reproduce, locate and fix a reported bug on existing code, with test evidence. Use when a specific bug is reported." }
}
```

- [ ] **Step 2: Write `scripts/lint.js`**

```js
const fs = require('fs');
const path = require('path');

const REQUIRED_SECTIONS = ['Overview', 'When to Use', 'Process', 'Anti-rationalization', 'Red Flags', 'Verification'];
const fm = require('../shared/frontmatter.json');
const sharedDir = path.join(__dirname, '..', 'shared');

let errors = [];

for (const skill of Object.keys(fm)) {
  const bodyPath = path.join(sharedDir, `${skill}.body.md`);
  if (!fs.existsSync(bodyPath)) { errors.push(`missing body: ${skill}.body.md`); continue; }
  const body = fs.readFileSync(bodyPath, 'utf8');
  for (const sec of REQUIRED_SECTIONS) {
    if (!new RegExp(`^##\\s+${sec}\\s*$`, 'm').test(body)) errors.push(`${skill}: missing section "${sec}"`);
  }
  const meta = fm[skill];
  if (!meta.name || !meta.description) errors.push(`${skill}: frontmatter missing name/description`);
  if (!/Use when /.test(meta.description)) errors.push(`${skill}: description must contain "Use when "`);
  if (body.includes('—')) errors.push(`${skill}: contains em-dash, use hyphen`);
}

if (errors.length) { console.error('LINT FAIL:\n' + errors.join('\n')); process.exit(1); }
console.log(`LINT OK: ${Object.keys(fm).length} skills`);
```

- [ ] **Step 3: Run lint to verify it fails (no bodies yet)**

Run: `npm run lint`
Expected: FAIL listing `missing body: aisp.body.md` and 7 more.

- [ ] **Step 4: Commit**

```bash
git add shared/frontmatter.json scripts/lint.js
git commit -m "feat: add frontmatter map and skill lint script"
```

---

### Task 3: Build script (body + frontmatter -> generated outputs)

**Files:**
- Create: `scripts/build.js`

**Interfaces:**
- Consumes: `shared/frontmatter.json`, `shared/<skill>.body.md`.
- Produces: `skills/<skill>/SKILL.md`, `.claude/commands/<skill>.md`, `copilot/.github/prompts/<skill>.prompt.md` for every skill. Idempotent: re-running with no source change yields identical files.

- [ ] **Step 1: Write `scripts/build.js`**

```js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const fm = require(path.join(root, 'shared', 'frontmatter.json'));
const read = p => fs.readFileSync(p, 'utf8');
const write = (p, c) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c); };

for (const skill of Object.keys(fm)) {
  const { name, description } = fm[skill];
  const body = read(path.join(root, 'shared', `${skill}.body.md`)).trimEnd() + '\n';

  // Claude SKILL.md
  const skillMd = `---\nname: ${name}\ndescription: ${description}\n---\n\n${body}`;
  write(path.join(root, 'skills', skill, 'SKILL.md'), skillMd);

  // Claude slash-command wrapper (thin: points at the skill)
  const cmd = `---\ndescription: ${description}\n---\n\nInvoke the ${name} skill and follow it exactly.\n`;
  write(path.join(root, '.claude', 'commands', `${skill}.md`), cmd);

  // Copilot prompt file (frontmatter + full body)
  const prompt = `---\nmode: agent\ndescription: ${description}\n---\n\n${body}`;
  write(path.join(root, 'copilot', '.github', 'prompts', `${skill}.prompt.md`), prompt);
}

console.log(`BUILD OK: generated ${Object.keys(fm).length} skills x 3 outputs`);
```

- [ ] **Step 2: Add a temporary stub body so build can run**

```bash
mkdir -p shared
printf '## Overview\n\nstub\n\n## When to Use\n\nstub\n\n## Process\n\nstub\n\n## Anti-rationalization\n\nstub\n\n## Red Flags\n\nstub\n\n## Verification\n\nstub\n' > shared/aisp.body.md
```

- [ ] **Step 3: Run build, verify outputs exist and are valid**

Run: `npm run build`
Expected: prints `BUILD OK`. Then:
Run: `test -f skills/aisp/SKILL.md && test -f .claude/commands/aisp.md && test -f copilot/.github/prompts/aisp.prompt.md && echo files-ok`
Expected: prints `files-ok`

- [ ] **Step 4: Verify idempotency**

Run: `npm run build && git status --porcelain skills/aisp/SKILL.md`
Expected: after a second build, no diff for an unchanged body.

- [ ] **Step 5: Remove the stub body (real one comes in Task 4)**

```bash
rm shared/aisp.body.md
```

- [ ] **Step 6: Commit**

```bash
git add scripts/build.js
git commit -m "feat: add build script generating Claude and Copilot skill files"
```

---

### Task 4: Orchestrator body `aisp` (modes, gates, routing)

**Files:**
- Create: `shared/aisp.body.md`

**Interfaces:**
- Consumes: invokes the 7 step skills by name.
- Produces: the gate wording and mode rules reused conceptually by step skills.

- [ ] **Step 1: Write `shared/aisp.body.md`** with the exact mandated blocks below, in the required section order.

The `## Process` section MUST contain verbatim:

```
### Modes
- `/aisp` (default): judge task size first. If trivial, PROPOSE a short flow
  and ask the human to confirm before running it. Never skip silently.
- `/aisp quick`: force the short flow (no size question).
- `/aisp full`: force all steps.

Full flow:  spec -> [GATE] -> plan -> [GATE] -> code -> test -> [opt GATE] -> review -> [GATE] -> doc
Short flow: spec(light) -> code -> test -> light review -> [GATE] -> doc

### Human gate (apply at every GATE)
STOP. Print a short summary of what was produced. Wait for the human to reply
with explicit approval ("approve" / "continue" / "go"). Do NOT proceed on
silence or assumption. Mandatory gates: after spec, after plan, after review.
Optional gates (after code, after test): skip only if the task is trivial or
the user said bypass.

### Test escalation
If /aisp-test exhausts its 2 fix attempts, STOP and route to /aisp-fix; do not
continue to review with failing tests.

### Model routing (Claude Code only)
If running in Claude Code, dispatch heavy steps to a subagent with a model by
weight: light (spec scaffold, simple test) -> haiku; normal (code, test) ->
sonnet; heavy (review, hard fix) -> opus. Print an announce line
`Agent <name> (<model>): <task>` per spawn. If not Claude Code, run inline.
```

The `## Anti-rationalization` section MUST contain this table (seed rows, extend as useful):

```
| Excuse | Reality |
|--------|---------|
| "Task is small, skip the spec." | One sentence of WHAT is still cheaper than rework. Write it. |
| "Skip the gate, I know it is right." | The human owns the gate. Stop and ask. |
| "Tests fail but the change looks fine." | Failing tests block review. Fix or route to /aisp-fix. |
```

`## Overview`, `## When to Use`, `## Red Flags`, `## Verification` written as normal prose. Verification MUST require: every mandatory gate was honored, and the test step ended green or escalated.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no error for `aisp` (other 7 still missing - that is fine for now, or run after all bodies exist).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `BUILD OK`.

- [ ] **Step 4: Commit**

```bash
git add shared/aisp.body.md skills/aisp .claude/commands/aisp.md copilot/.github/prompts/aisp.prompt.md
git commit -m "feat: add aisp orchestrator skill"
```

---

### Task 5: `aisp-spec` body

**Files:**
- Create: `shared/aisp-spec.body.md`

**Interfaces:**
- Produces: spec file at `docs/specs/<slug>-<date>.md`; consumed by `aisp-plan`.

- [ ] **Step 1: Write `shared/aisp-spec.body.md`** (6 sections). `## Process` MUST include verbatim:

```
1. Ask only the questions needed to pin down WHAT: purpose, inputs, outputs,
   success criteria, out-of-scope. One question at a time.
2. Draft the spec: Goal, Requirements, Success criteria, Non-goals.
3. Ask "Export spec to file?" If yes, write docs/specs/<slug>-<date>.md
   (<slug> = short kebab task name, <date> = YYYY-MM-DD). Never write silently.
4. GATE (mandatory): print the spec summary, wait for explicit approval of WHAT
   before any planning or code.
```

`## Anti-rationalization` MUST include row: `| "I'll figure out requirements while coding." | Unwritten WHAT causes rework. Pin it first. |`. `## Verification` MUST require an approved WHAT before exit.

- [ ] **Step 2: Lint + build**

Run: `npm run lint && npm run build`
Expected: lint OK for `aisp-spec`, `BUILD OK`.

- [ ] **Step 3: Commit**

```bash
git add shared/aisp-spec.body.md skills/aisp-spec .claude/commands/aisp-spec.md copilot/.github/prompts/aisp-spec.prompt.md
git commit -m "feat: add aisp-spec skill"
```

---

### Task 6: `aisp-plan` body

**Files:**
- Create: `shared/aisp-plan.body.md`

**Interfaces:**
- Consumes: approved spec from `aisp-spec`.
- Produces: plan file at `docs/plans/<slug>-<date>.md`; consumed by `aisp-code`.

- [ ] **Step 1: Write `shared/aisp-plan.body.md`**. `## Process` MUST include verbatim:

```
1. Read the approved spec. If none exists, stop and tell the user to run /aisp-spec.
2. Break the work into bite-sized, independently testable tasks (file paths,
   exact changes, how to test each).
3. Ask "Export plan to file?" If yes, write docs/plans/<slug>-<date>.md.
4. GATE (mandatory): print the task list, wait for explicit approval before coding.
```

`## Anti-rationalization` row: `| "Plan in my head is enough." | A written plan is the gate artifact and the executor's map. Write it. |`. `## Verification`: an approved task list exists before exit.

- [ ] **Step 2: Lint + build**

Run: `npm run lint && npm run build`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add shared/aisp-plan.body.md skills/aisp-plan .claude/commands/aisp-plan.md copilot/.github/prompts/aisp-plan.prompt.md
git commit -m "feat: add aisp-plan skill"
```

---

### Task 7: `aisp-code` body

**Files:**
- Create: `shared/aisp-code.body.md`

**Interfaces:**
- Consumes: approved plan from `aisp-plan`.
- Produces: code changes; consumed by `aisp-test`.

- [ ] **Step 1: Write `shared/aisp-code.body.md`**. `## Process` MUST include verbatim:

```
1. Follow the approved plan task by task. Make surgical edits; match existing
   code style, naming and patterns. No unrelated refactor.
2. Do not invent scope beyond the plan. If a needed change is missing from the
   plan, stop and flag it.
3. Optional GATE after a coherent change: offer a diff review. Skip if the task
   is trivial or the user said bypass.
4. Hand off to /aisp-test.
```

`## Anti-rationalization` row: `| "While I'm here I'll refactor this too." | Scope creep breaks the plan-gate contract. Stay in scope. |`. `## Verification`: changes map to plan tasks; no out-of-scope edits.

- [ ] **Step 2: Lint + build**

Run: `npm run lint && npm run build`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add shared/aisp-code.body.md skills/aisp-code .claude/commands/aisp-code.md copilot/.github/prompts/aisp-code.prompt.md
git commit -m "feat: add aisp-code skill"
```

---

### Task 8: `aisp-test` body (auto-fix loop + stack detect + evidence)

**Files:**
- Create: `shared/aisp-test.body.md`

**Interfaces:**
- Produces: UT evidence at `reports/ut-report-<slug>-<date>.md` (only if user approves export).

- [ ] **Step 1: Write `shared/aisp-test.body.md`**. `## Process` MUST include verbatim:

```
1. Detect the stack and pick the test command:
   - package.json -> npm test (or the project's configured script)
   - pom.xml      -> mvn -q test
   - build.gradle / build.gradle.kts -> ./gradlew test
   - pubspec.yaml -> flutter test
   If none match, ask the user for the test command.
2. Run the tests.
3. Auto-fix loop (max 2 attempts):
   - all green: go to step 4.
   - failing: read the log, apply a fix, re-run. Count the attempt.
   - after 2 failed attempts: STOP, summarize the failure, suggest /aisp-fix.
     Do not continue with failing tests.
4. Ask "Export UT report to file?" If yes, write
   reports/ut-report-<slug>-<date>.md with: raw test output, pass/fail counts,
   coverage if available. Never write silently.
5. Optional GATE: offer to stop for human review of results. Skip if trivial
   or bypass requested.
```

`## Anti-rationalization` rows: `| "Tests are flaky, just rerun forever." | Loop is bounded at 2. Escalate, do not spin. |` and `| "I'll add tests later." | Later never comes. Cover the change now. |`. `## Verification`: tests ended green OR escalated after 2 attempts; evidence offered.

- [ ] **Step 2: Lint + build**

Run: `npm run lint && npm run build`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add shared/aisp-test.body.md skills/aisp-test .claude/commands/aisp-test.md copilot/.github/prompts/aisp-test.prompt.md
git commit -m "feat: add aisp-test skill with bounded auto-fix loop"
```

---

### Task 9: `aisp-review` body (light + full, merge gate)

**Files:**
- Create: `shared/aisp-review.body.md`

**Interfaces:**
- Produces: review evidence at `reports/review-<slug>-<date>.md` (full mode, if approved).

- [ ] **Step 1: Write `shared/aisp-review.body.md`**. `## Process` MUST include verbatim:

```
1. Review the diff for correctness bugs, security issues, and quality problems.
   Each finding: location + severity (HIGH / MED / LOW) + concrete fix.
2. Mode:
   - full review (default / from /aisp full): ask "Export review report to
     file?"; if yes write reports/review-<slug>-<date>.md.
   - light review (from short / quick flow): fast pass, findings inline, no
     report file. Still produce findings.
3. GATE (mandatory): present findings, let the human decide fix-vs-merge.
   Never auto-merge.
```

`## Anti-rationalization` rows: `| "Looks fine, skip review." | Review is the cheapest bug catch. Run at least a light pass. |` and `| "I'll just merge, it's small." | Merge is the human's call at the gate. Stop and ask. |`. `## Verification`: findings produced and the merge gate was honored.

- [ ] **Step 2: Lint + build**

Run: `npm run lint && npm run build`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add shared/aisp-review.body.md skills/aisp-review .claude/commands/aisp-review.md copilot/.github/prompts/aisp-review.prompt.md
git commit -m "feat: add aisp-review skill with light and full modes"
```

---

### Task 10: `aisp-doc` body

**Files:**
- Create: `shared/aisp-doc.body.md`

**Interfaces:**
- Produces: notes file at `docs/notes/<slug>-<date>.md` (if approved).

- [ ] **Step 1: Write `shared/aisp-doc.body.md`**. `## Process` MUST include verbatim:

```
1. Gather what changed vs the spec/plan: decisions made that were not in the
   spec, things changed, tradeoffs, anything the team should know.
2. Ask "Export doc/notes to file?" If yes, write docs/notes/<slug>-<date>.md.
   Never write silently.
3. Keep it short and factual. Link the spec, plan, and any reports.
```

`## Anti-rationalization` row: `| "The code is self-documenting." | Decisions and tradeoffs are not in the diff. Record the why. |`. `## Verification`: decisions and tradeoffs captured if any were made.

- [ ] **Step 2: Lint + build**

Run: `npm run lint && npm run build`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add shared/aisp-doc.body.md skills/aisp-doc .claude/commands/aisp-doc.md copilot/.github/prompts/aisp-doc.prompt.md
git commit -m "feat: add aisp-doc skill"
```

---

### Task 11: `aisp-fix` body (standalone bug fix)

**Files:**
- Create: `shared/aisp-fix.body.md`

**Interfaces:**
- Produces: UT evidence at `reports/ut-report-<slug>-<date>.md` after the fix (if approved).

- [ ] **Step 1: Write `shared/aisp-fix.body.md`**. `## Process` MUST include verbatim:

```
1. Reproduce the reported bug. If you cannot reproduce, stop and ask for steps.
2. Locate the root cause (not just the symptom). State the hypothesis.
3. Write or identify a failing test that captures the bug.
4. Apply the minimal fix. Re-run the test; confirm green.
5. Run the surrounding test suite to check for regressions.
6. Ask "Export UT report to file?"; if yes write reports/ut-report-<slug>-<date>.md.
```

`## Anti-rationalization` rows: `| "I see the symptom, patch it." | Patch the root cause, not the symptom. |` and `| "No test, I verified by hand." | A failing-then-passing test proves the fix and guards regressions. Add it. |`. `## Verification`: a test reproduces the bug and now passes; no regressions.

- [ ] **Step 2: Lint + build (all 8 bodies now exist)**

Run: `npm run lint && npm run build`
Expected: `LINT OK: 8 skills`, `BUILD OK: generated 8 skills x 3 outputs`.

- [ ] **Step 3: Commit**

```bash
git add shared/aisp-fix.body.md skills/aisp-fix .claude/commands/aisp-fix.md copilot/.github/prompts/aisp-fix.prompt.md
git commit -m "feat: add aisp-fix skill"
```

---

### Task 12: Copilot always-on note + README + final validation

**Files:**
- Create: `copilot/.github/copilot-instructions.md`
- Create: `README.md`

**Interfaces:**
- Consumes: all generated files.

- [ ] **Step 1: Write `copilot/.github/copilot-instructions.md`**

```markdown
# aisp SDLC skills (Copilot)

This project ships the `aisp` SDLC prompts in `.github/prompts/`. Type `/aisp`
in Copilot Chat to run the guided flow, or `/aisp-spec`, `/aisp-plan`,
`/aisp-code`, `/aisp-test`, `/aisp-review`, `/aisp-doc`, `/aisp-fix` for a single
step. Human approval gates after spec, plan, and review are mandatory - wait for
the developer to approve before continuing. Model routing is Claude-only and does
not apply here.
```

- [ ] **Step 2: Write `README.md`** covering both install paths verbatim:

```markdown
# ksh-skills

Eight SDLC skills (prefix `aisp`) for a guided spec -> plan -> code -> test ->
review -> doc flow, plus a standalone bug-fix skill. Human gates at the
important steps; evidence reports for tests and review.

## Skills
- `/aisp` - orchestrator (judges task size, runs the flow with gates)
- `/aisp-spec` `/aisp-plan` `/aisp-code` `/aisp-test` `/aisp-review` `/aisp-doc` `/aisp-fix`

## Install A - Claude Code (plugin, once per machine)
1. Clone this repo.
2. Add it as a plugin so Claude Code loads `.claude-plugin/plugin.json`.
3. `/aisp` is now available in every project.

## Install B - GitHub Copilot (copy into a project, no install)
1. Copy `copilot/.github/prompts/aisp-*.prompt.md` into your project's
   `.github/prompts/` folder.
2. (Optional) copy `copilot/.github/copilot-instructions.md` into your
   project's `.github/`.
3. In that project, type `/aisp` in Copilot Chat.

## For maintainers
- Edit skill content in `shared/*.body.md` only. Never hand-edit generated files.
- Run `npm run lint` then `npm run build` to regenerate `skills/`,
  `.claude/commands/`, and `copilot/.github/prompts/`.
```

- [ ] **Step 3: Final full validation**

Run: `npm run lint && npm run build`
Expected: `LINT OK: 8 skills` and `BUILD OK: generated 8 skills x 3 outputs`.
Run: `ls skills && ls copilot/.github/prompts`
Expected: 8 skill dirs and 8 `.prompt.md` files.

- [ ] **Step 4: Commit**

```bash
git add copilot/.github/copilot-instructions.md README.md
git commit -m "docs: add Copilot instructions and README with both install paths"
```

---

## Self-Review

**Spec coverage:**
- 8 skills + prefix `aisp` -> Tasks 4-11. ✓
- Plugin manifest values -> Task 1. ✓
- Two install paths -> Task 12 (README) + Task 1 (manifest) + Task 3 (Copilot prompt generation). ✓
- Human gates (spec/plan/review mandatory, code/test optional) -> orchestrator Task 4 + each step task. ✓
- Quick/full modes + task-size proposal + light review -> Task 4 (modes) + Task 9 (light review). ✓
- Test auto-fix loop bound 2 + escalate to fix -> Task 8. ✓
- Evidence ask-first, paths, not committed -> Tasks 8, 9, 11 + `.gitignore reports/` Task 1. ✓
- Model routing Claude-only -> Task 4. ✓
- SKILL.md anatomy (6 sections + frontmatter) -> enforced by lint Task 2, authored Tasks 4-11. ✓
- Stack auto-detect matrix -> Task 8. ✓
- Shared-body include method (build script, not runtime include) -> Task 3 resolves open item 4. ✓
- No em-dash -> lint Task 2. ✓

**Placeholder scan:** No TBD/TODO. Each skill task gives exact frontmatter (Task 2), verbatim mandatory Process/Anti-rationalization/Verification content, and exact build/commit commands. Prose sections (Overview/When to Use/Red Flags) are guided, not placeholdered.

**Type consistency:** `frontmatter.json` keys, `shared/<skill>.body.md` names, generated paths, and commit `git add` paths use the same 8 skill names throughout. Build output triple (`skills/`, `.claude/commands/`, `copilot/.github/prompts/`) consistent across Tasks 3-12.

**Open spec item still deferred:** Copilot `.prompt.md` frontmatter (`mode: agent`) is the documented default in Task 3; verify against current Copilot docs during execution and adjust the one template line if needed - it does not change any skill body.
