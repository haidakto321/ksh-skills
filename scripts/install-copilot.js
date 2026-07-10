#!/usr/bin/env node
// Installs the Copilot files into a target project:
//   npx github:haidakto321/ksh-skills [target-dir] [--force]
// Copies copilot/.github/** -> <target>/.github/. Safe to rerun as an
// updater: ksh-* and web-* files are ours and always overwritten, while a
// project's own copilot-instructions.md is kept unless --force is given.
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const force = args.includes('--force');
const targetArg = args.find(a => !a.startsWith('--'));
const target = path.resolve(targetArg || '.');
const srcRoot = path.join(__dirname, '..', 'copilot', '.github');
const dstRoot = path.join(target, '.github');

if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
  console.error(`Target directory not found: ${target}`);
  process.exit(1);
}
if (!fs.existsSync(srcRoot)) {
  console.error(`Source missing: ${srcRoot} (run "npm run build" first?)`);
  process.exit(1);
}

// Files matching this are shipped by ksh-skills, so overwriting them is an
// update, not data loss. Anything else (a project's own
// copilot-instructions.md) is only replaced with --force.
const OURS = /^(ksh([.-][^/\\]*)?|web-[^/\\]*\.instructions\.md)$/;

const copied = [];
const skipped = [];
(function walk(rel) {
  for (const entry of fs.readdirSync(path.join(srcRoot, rel), { withFileTypes: true })) {
    const relPath = path.join(rel, entry.name);
    if (entry.isDirectory()) { walk(relPath); continue; }
    const to = path.join(dstRoot, relPath);
    if (fs.existsSync(to) && !OURS.test(entry.name) && !force) {
      skipped.push(relPath);
      continue;
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(srcRoot, relPath), to);
    copied.push(relPath);
  }
})('');

console.log(`ksh-skills: ${copied.length} file(s) -> ${dstRoot}`);
for (const f of copied) console.log(`  + ${f}`);
for (const f of skipped) console.log(`  skipped (exists, not ours): ${f} - use --force to overwrite`);
console.log('Done. Type /ksh in Copilot Chat inside that project. Rerun this command anytime to update.');
