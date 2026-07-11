#!/usr/bin/env node
// npx entry point. Dispatches on --claude:
//   npx github:haidakto321/ksh-skills [target] [--force]   -> Copilot install (default)
//   npx github:haidakto321/ksh-skills --claude [target]    -> Claude Code standalone install
if (process.argv.includes('--claude')) {
  require('./install-claude.js');
} else {
  require('./install-copilot.js');
}
