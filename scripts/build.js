const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const fm = require(path.join(root, 'shared', 'frontmatter.json'));
const read = p => fs.readFileSync(p, 'utf8');
const write = (p, c) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c); };

for (const skill of Object.keys(fm)) {
  const { name, description } = fm[skill];
  const bodyPath = path.join(root, 'shared', `${skill}.body.md`);
  if (!fs.existsSync(bodyPath)) {
    console.error(`BUILD FAIL: missing body ${skill}.body.md (run "npm run lint" to list all gaps)`);
    process.exit(1);
  }
  const body = read(bodyPath).trimEnd() + '\n';
  // YAML scalars must be quoted: a description with ": ", a leading quote/brace,
  // or "#" would otherwise produce invalid frontmatter. JSON.stringify yields a
  // valid double-quoted YAML scalar.
  const desc = JSON.stringify(description);

  // Claude SKILL.md
  const skillMd = `---\nname: ${name}\ndescription: ${desc}\n---\n\n${body}`;
  write(path.join(root, 'skills', skill, 'SKILL.md'), skillMd);

  // Claude slash-command wrapper (thin: points at the skill)
  const cmd = `---\ndescription: ${desc}\n---\n\nInvoke the ${name} skill and follow it exactly.\n`;
  write(path.join(root, '.claude', 'commands', `${skill}.md`), cmd);

  // Copilot prompt file (frontmatter + full body)
  const prompt = `---\nagent: 'agent'\ndescription: ${desc}\n---\n\n${body}`;
  write(path.join(root, 'copilot', '.github', 'prompts', `${skill}.prompt.md`), prompt);
}

console.log(`BUILD OK: generated ${Object.keys(fm).length} skills x 3 outputs`);
