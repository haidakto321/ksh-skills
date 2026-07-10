const fs = require('fs');
const path = require('path');
const { renderFor } = require('./render');

const REQUIRED_SECTIONS = ['Overview', 'When to Use', 'Process', 'Anti-rationalization', 'Red Flags', 'Verification'];
const root = path.join(__dirname, '..');
const fm = require(path.join(root, 'shared', 'frontmatter.json'));
const cfg = require(path.join(root, 'shared', 'models.json'));
const sharedDir = path.join(root, 'shared');

const VALID_WEIGHTS = ['light', 'normal', 'heavy'];
const NO_FLOW = ['ksh', 'ksh-fix'];  // orchestrator + standalone bug-fix sit outside the flow
const WORD_BUDGET = 600;             // soft per-target body budget (tokens are paid per invoke; the ksh orchestrator sets the ceiling, atomic skills should stay well under)
const EM_DASH = String.fromCharCode(0x2014); // build the char without a literal em-dash in source
let errors = [];
let warnings = [];

// models.json must define a Copilot model (string or non-empty array) and a
// Claude alias/model id for every tier
const tierModels = (cfg.copilot || {}).weights || {};
const claudeModels = cfg.claude || {};
for (const w of VALID_WEIGHTS) {
  const m = tierModels[w];
  const ok = typeof m === 'string' ? m.length > 0 : Array.isArray(m) && m.length > 0;
  if (!ok) errors.push(`models.json: copilot.weights.${w} must be a non-empty model name or list`);
  if (typeof claudeModels[w] !== 'string' || !claudeModels[w]) {
    errors.push(`models.json: claude.${w} must be a non-empty alias or model id`);
  }
}

// descriptions ship into generated frontmatter - keep the raw file em-dash free
if (fs.readFileSync(path.join(sharedDir, 'frontmatter.json'), 'utf8').includes(EM_DASH)) {
  errors.push('frontmatter.json: contains em-dash, use hyphen');
}

const flowPositions = new Map();
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
  if (!/^Use when /.test(meta.description || '')) errors.push(`${skill}: description must start with "Use when "`);
  if ((meta.description || '').length > 500) errors.push(`${skill}: description over 500 chars`);
  if (!VALID_WEIGHTS.includes(meta.weight)) errors.push(`${skill}: weight must be one of ${VALID_WEIGHTS.join('/')}, got "${meta.weight}"`);
  if (body.includes(EM_DASH)) errors.push(`${skill}: contains em-dash, use hyphen`);

  // flow: every skill except NO_FLOW needs a unique integer position, so a new
  // skill cannot silently miss the orchestrator's handoff list in build.js
  if (NO_FLOW.includes(skill)) {
    if ('flow' in meta) errors.push(`${skill}: must not have a flow position (outside the flow by design)`);
  } else if (!Number.isInteger(meta.flow) || meta.flow < 1) {
    errors.push(`${skill}: missing integer "flow" position (orchestrator handoffs derive from it)`);
  } else if (flowPositions.has(meta.flow)) {
    errors.push(`${skill}: flow ${meta.flow} duplicates ${flowPositions.get(meta.flow)}`);
  } else {
    flowPositions.set(meta.flow, skill);
  }

  // {{claude.X}} placeholders must reference a configured weight, or the build
  // would emit them unresolved
  for (const m of body.matchAll(/\{\{claude\.([a-zA-Z0-9_-]+)\}\}/g)) {
    if (!VALID_WEIGHTS.includes(m[1])) errors.push(`${skill}: unknown placeholder {{claude.${m[1]}}}`);
  }

  // tool-specific marker blocks must be balanced, and each target must stay
  // inside the soft word budget after stripping the other tool's blocks
  for (const tool of ['claude', 'copilot']) {
    const starts = (body.match(new RegExp(`<!-- ${tool}:start -->`, 'g')) || []).length;
    const ends = (body.match(new RegExp(`<!-- ${tool}:end -->`, 'g')) || []).length;
    if (starts !== ends) { errors.push(`${skill}: unbalanced ${tool} marker blocks`); continue; }
    const words = renderFor(tool, body).split(/\s+/).filter(Boolean).length;
    if (words > WORD_BUDGET) warnings.push(`${skill}: ${tool} body is ${words} words (soft budget ${WORD_BUDGET})`);
  }
}

// checklists become Copilot instruction files - each needs an applyTo glob
const clDir = path.join(sharedDir, 'checklists');
if (fs.existsSync(clDir)) {
  for (const f of fs.readdirSync(clDir).filter(f => f.endsWith('.md'))) {
    const raw = fs.readFileSync(path.join(clDir, f), 'utf8');
    if (!/^---\r?\n[\s\S]*?applyTo:/.test(raw)) errors.push(`checklists/${f}: missing applyTo frontmatter`);
    if (raw.includes(EM_DASH)) errors.push(`checklists/${f}: contains em-dash, use hyphen`);
  }
}

if (warnings.length) console.warn('LINT WARN:\n' + warnings.join('\n'));
if (errors.length) { console.error('LINT FAIL:\n' + errors.join('\n')); process.exit(1); }
console.log(`LINT OK: ${Object.keys(fm).length} skills`);
