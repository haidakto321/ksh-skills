#!/usr/bin/env node
// Installs the skills standalone into Claude Code (no plugin namespace, so
// commands are the short /ksh, /ksh-spec, ... forms):
//   npx github:haidakto321/ksh-skills --claude            -> ~/.claude/skills (all projects)
//   npx github:haidakto321/ksh-skills --claude <project>  -> <project>/.claude/skills (one project)
// Safe to rerun as an updater: each skills/ksh-* directory is ours, so it is
// wiped and re-copied. Nothing outside ksh-* is touched.
const fs = require('fs');
const os = require('os');
const path = require('path');

const args = process.argv.slice(2);
const targetArg = args.find(a => !a.startsWith('--'));
const dstRoot = targetArg
  ? path.join(path.resolve(targetArg), '.claude', 'skills')
  : path.join(os.homedir(), '.claude', 'skills');
const srcRoot = path.join(__dirname, '..', 'skills');

if (targetArg && !(fs.existsSync(path.resolve(targetArg)) && fs.statSync(path.resolve(targetArg)).isDirectory())) {
  console.error(`Target directory not found: ${path.resolve(targetArg)}`);
  process.exit(1);
}
if (!fs.existsSync(srcRoot)) {
  console.error(`Source missing: ${srcRoot} (run "npm run build" first?)`);
  process.exit(1);
}

const skills = fs.readdirSync(srcRoot, { withFileTypes: true })
  .filter(e => e.isDirectory() && /^ksh(-|$)/.test(e.name))
  .map(e => e.name);
if (skills.length === 0) {
  console.error(`No ksh-* skills found in ${srcRoot}`);
  process.exit(1);
}

for (const name of skills) {
  const dst = path.join(dstRoot, name);
  // ksh-* dirs are ours by convention: replace wholesale so renamed or
  // removed files inside a skill don't linger after an update.
  fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(path.join(srcRoot, name), dst, { recursive: true });
}

console.log(`ksh-skills: ${skills.length} skill(s) -> ${dstRoot}`);
for (const name of skills) console.log(`  + ${name}`);
console.log('Done. Restart Claude Code (or /reload), then type /ksh.');
console.log('Note: if the ksh-skills plugin is also installed, /ksh-skills:ksh will appear alongside /ksh - uninstall the plugin to keep only the short names.');
