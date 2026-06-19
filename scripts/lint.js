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
  // split body into sections keyed by "## <title>"
  const sectionMap = {};
  for (const part of body.split(/^##\s+/m)) {
    const nl = part.indexOf('\n');
    if (nl === -1) continue;
    sectionMap[part.slice(0, nl).trim()] = part.slice(nl + 1).trim();
  }
  for (const sec of REQUIRED_SECTIONS) {
    if (!(sec in sectionMap)) { errors.push(`${skill}: missing section "${sec}"`); continue; }
    const raw = sectionMap[sec];
    // reject empty or stub sections (gaming the lint with placeholder content)
    const content = raw.replace(/\|[-\s|]*\|/g, '').replace(/[#|>*\-\s]/g, ' ').trim();
    if (content.length < 20 || /^stub\.?$/i.test(raw)) {
      errors.push(`${skill}: section "${sec}" is empty or stub content`);
    }
  }
  const meta = fm[skill];
  if (!meta.name || !meta.description) errors.push(`${skill}: frontmatter missing name/description`);
  if (!/Use when /.test(meta.description)) errors.push(`${skill}: description must contain "Use when "`);
  const EM_DASH = String.fromCharCode(0x2014); // build the char without a literal em-dash in source
  if (body.includes(EM_DASH)) errors.push(`${skill}: contains em-dash, use hyphen`);
}

if (errors.length) { console.error('LINT FAIL:\n' + errors.join('\n')); process.exit(1); }
console.log(`LINT OK: ${Object.keys(fm).length} skills`);
