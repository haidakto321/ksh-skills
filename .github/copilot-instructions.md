# ksh SDLC skills (Copilot)

This project ships the `ksh` SDLC prompts in `.github/prompts/`. Type `/ksh`
in Copilot Chat to run the guided flow, or run a single step: `/ksh-spec`, `/ksh-design`, `/ksh-plan`, `/ksh-code`, `/ksh-test`, `/ksh-review`, `/ksh-security`, `/ksh-doc`, `/ksh-fix`.
Human approval gates after spec, plan, and review are mandatory - wait for the
developer to approve before continuing. Model routing: tier agents in
`.github/agents/` carry per-weight model fallback lists used by handoffs;
prompt files pin a tier model only when built with `pin: true`. Web review
checklists in `.github/instructions/` auto-apply by file glob during
`/ksh-review`.
