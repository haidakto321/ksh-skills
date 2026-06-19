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
