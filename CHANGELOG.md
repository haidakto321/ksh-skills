# Changelog

## Unreleased

### Added
- `ksh-design` (new, conditional): a HOW-design step between spec and plan.
  Fires only when the approach is non-obvious (more than one viable approach,
  a new subsystem/integration, an architectural or cross-cutting choice, a
  hard-to-reverse contract); otherwise it is skipped, like the security step.
  Explores context, weighs 2-3 approaches with trade-offs, and records a design
  doc under `docs/designs/`. Flow renumbered: plan/code/test/review/security/doc
  shift +1.
- Claude Code standalone install (`npx github:haidakto321/ksh-skills --claude`,
  local: `node scripts/install-claude.js`): copies `skills/ksh-*` into
  `~/.claude/skills/` (or `<project>/.claude/skills/` with a target arg) so
  commands work as the short `/ksh`, `/ksh-spec`, ... forms - plugin installs
  are always namespaced (`/ksh-skills:ksh`) and cannot be shortened. The npx
  entry point is now `scripts/install.js`, dispatching on `--claude` (default
  remains the Copilot install, unchanged).

## 0.2.0 - 2026-07-10

### Fixed
- Root `.github/` Copilot files were stale hand copies (old model names like
  GPT-4.1, wrong tier for ksh-spec, ksh-security missing). `.github/` is now a
  generated mirror of `copilot/.github/`, rewritten on every build.
- `copilot-instructions.md` is now generated from `frontmatter.json`, so the
  skill list cannot drift (it omitted `/ksh-security` and wrongly claimed model
  routing is Claude-only).

### Added
- Web review checklists (`shared/checklists/`: security, a11y, perf). Copilot
  gets them as auto-applied `.github/instructions/*.instructions.md`; Claude
  gets them as supporting files under `skills/ksh-review/checklists/`.
- `ksh-test` stack detection: pnpm/yarn/bun lockfiles, `tsc --noEmit` typecheck,
  eslint/biome lint, pytest, go, cargo, dotnet, and Playwright/Cypress e2e at
  deep level.
- `flow` field in `frontmatter.json` - single source of truth for the
  orchestrator handoff order; lint rejects a flow-less skill so new skills
  cannot silently miss the flow.
- `shared/models.json` (replaces `copilot-models.json`): new `claude` section
  makes the Claude subagent alias per weight configurable - set
  `"heavy": "sonnet"` to cap token cost. Bodies use `{{claude.<weight>}}`
  placeholders resolved at build time.
- Lint checks: description starts with "Use when", description length <= 500,
  em-dash scan of frontmatter.json and checklists, balanced tool-marker blocks,
  `{{claude.*}}` placeholder validation, soft per-target word budget (600)
  with warnings.
- One-command Copilot install: `npx github:haidakto321/ksh-skills [target]
  [--force]` (scripts/install-copilot.js + package.json bin). Rerunnable as
  an updater; keeps a project's own copilot-instructions.md unless --force.
- LICENSE (MIT), CHANGELOG.md, TESTING.md, plugin.json metadata
  (repository/license/keywords).

### Changed
- All skill descriptions now lead with "Use when ..." (trigger-first, per skill
  authoring guidance).
- Bodies support `<!-- claude:start/end -->` / `<!-- copilot:start/end -->`
  markers; build strips the other tool's blocks per output, so each runtime
  loads only its own routing/escalation text.
- Overview / When to Use sections trimmed across bodies (less duplication of
  the frontmatter description).
- `ksh-test` evidence: failing tests verbatim + runner summary tail instead of
  the full raw log.
- `ksh-security` cites OWASP Top 10 IDs as 2021 edition explicitly.

## 0.1.0 - 2026-06-19
- Initial release: 9 skills, Claude plugin + Copilot prompts, model routing,
  human gates, evidence reports.
