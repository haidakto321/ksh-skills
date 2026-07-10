const fs = require('fs');
const path = require('path');
const { renderFor } = require('./render');

const root = path.join(__dirname, '..');
const fm = require(path.join(root, 'shared', 'frontmatter.json'));
const cfg = require(path.join(root, 'shared', 'models.json'));
const tierModels = cfg.copilot.weights;      // { light, normal, heavy } -> Copilot model name(s)
const pinModel = cfg.copilot.pin !== false;  // pin tier model into each prompt? (default true)
const claudeModels = cfg.claude;             // { light, normal, heavy } -> Claude alias/model id
// {{claude.<weight>}} placeholders in bodies resolve from models.json, so a
// user can route e.g. heavy steps to sonnet by editing config, not prose.
const subAliases = s => s.replace(/\{\{claude\.(light|normal|heavy)\}\}/g, (_, w) => claudeModels[w]);
const read = p => fs.readFileSync(p, 'utf8');
const write = (p, c) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c); };
// Copilot outputs are written twice: copilot/.github/** is the distribution
// template users copy into their projects; .github/** is a generated mirror so
// Copilot in THIS repo dogfoods the same files (it used to be a stale hand
// copy). Never hand-edit either side.
const writeCopilot = (rel, c) => {
  write(path.join(root, 'copilot', '.github', rel), c);
  write(path.join(root, '.github', rel), c);
};

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
  const model = tierModels[fm[skill].weight]; // Copilot model for this skill's tier

  // Claude SKILL.md
  const skillMd = `---\nname: ${name}\ndescription: ${desc}\n---\n\n${subAliases(renderFor('claude', body))}`;
  write(path.join(root, 'skills', skill, 'SKILL.md'), skillMd);

  // Claude plugin command wrapper (thin: points at the skill).
  // Must live in commands/ at the plugin root - .claude/commands/ is project-only
  // and is NOT packaged when installed as a plugin.
  const cmd = `---\ndescription: ${desc}\n---\n\nInvoke the ${name} skill and follow it exactly.\n`;
  write(path.join(root, 'commands', `${skill}.md`), cmd);

  // Copilot prompt file. When pinModel is true, model: hard-sets the tier model
  // (auto routing); when false, model: is omitted so the user's picked model runs.
  const modelLine = pinModel ? `model: ${JSON.stringify(model)}\n` : '';
  const prompt = `---\nagent: 'agent'\n${modelLine}description: ${desc}\n---\n\n${subAliases(renderFor('copilot', body))}`;
  writeCopilot(path.join('prompts', `${skill}.prompt.md`), prompt);
}

// Web review checklists: authored once in shared/checklists/ with Copilot
// instructions frontmatter (applyTo glob). Copilot gets them verbatim as
// auto-applied instruction files; Claude gets them (frontmatter stripped) as
// supporting files next to the ksh-review skill, loaded on demand.
const clDir = path.join(root, 'shared', 'checklists');
const checklists = fs.existsSync(clDir) ? fs.readdirSync(clDir).filter(f => f.endsWith('.md')) : [];
for (const f of checklists) {
  const raw = read(path.join(clDir, f));
  writeCopilot(path.join('instructions', f.replace(/\.md$/, '.instructions.md')), raw);
  const noFm = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n+/, '');
  write(path.join(root, 'skills', 'ksh-review', 'checklists', f), noFm);
}

// Copilot custom agents - one per weight tier. Each pins its tier model and is a
// handoff target for the orchestrator (so a simple step runs on a lighter model).
for (const weight of Object.keys(tierModels)) {
  const desc = JSON.stringify(`ksh ${weight}-tier agent - runs ${weight} steps on the ${weight} model.`);
  const agent = `---\nname: ksh-${weight}\ndescription: ${desc}\nmodel: ${JSON.stringify(tierModels[weight])}\n---\n\nRun the requested ksh step on the ${weight} tier. Follow the invoking skill's process and gates exactly.\n`;
  writeCopilot(path.join('agents', `ksh-${weight}.agent.md`), agent);
}

// Copilot orchestrator agent with gated handoffs. Each handoff is a button the
// human clicks to advance one step (= the human gate; send:false never
// auto-submits), and each runs on the target tier's model via a tier agent.
// Flow order comes from the `flow` field in frontmatter.json (single source of
// truth, validated by lint), so adding a skill there updates the handoffs too.
const FLOW = Object.keys(fm)
  .filter(k => Number.isInteger(fm[k].flow))
  .sort((a, b) => fm[a].flow - fm[b].flow);
// No per-handoff model: each handoff targets its tier agent, whose own `model`
// (a fallback list) decides the model. This avoids assuming the handoff model
// field accepts an array, and the tier agent already carries the fallback chain.
const handoffs = FLOW.map((step) => {
  const weight = fm[step].weight;
  const label = step.replace('ksh-', '');
  return [
    `  - label: ${JSON.stringify(label[0].toUpperCase() + label.slice(1))}`,
    `    agent: ksh-${weight}`,
    `    prompt: ${JSON.stringify(`Run the ${step} step now. Follow its process and gates exactly.`)}`,
    `    send: false`,
  ].join('\n');
}).join('\n');
const orchBody = read(path.join(root, 'shared', 'ksh.body.md')).trimEnd() + '\n';
const orchestrator = `---\nname: ksh\ndescription: ${JSON.stringify('ksh SDLC orchestrator - gated spec to doc flow; each handoff advances one step on its tier model.')}\nmodel: ${JSON.stringify(tierModels.normal)}\nhandoffs:\n${handoffs}\n---\n\n${subAliases(renderFor('copilot', orchBody))}`;
writeCopilot(path.join('agents', 'ksh.agent.md'), orchestrator);

// copilot-instructions.md is generated from frontmatter.json so the skill list
// can never drift from the shipped skills (it used to omit ksh-security).
const steps = Object.keys(fm).filter(s => s !== 'ksh').map(s => `\`/${s}\``).join(', ');
const instructions = `# ksh SDLC skills (Copilot)

This project ships the \`ksh\` SDLC prompts in \`.github/prompts/\`. Type \`/ksh\`
in Copilot Chat to run the guided flow, or run a single step: ${steps}.
Human approval gates after spec, plan, and review are mandatory - wait for the
developer to approve before continuing. Model routing: tier agents in
\`.github/agents/\` carry per-weight model fallback lists used by handoffs;
prompt files pin a tier model only when built with \`pin: true\`. Web review
checklists in \`.github/instructions/\` auto-apply by file glob during
\`/ksh-review\`.
`;
writeCopilot('copilot-instructions.md', instructions);

const tierCount = Object.keys(tierModels).length;
console.log(`BUILD OK: ${Object.keys(fm).length} skills x 3 outputs + ${checklists.length} checklists + ${tierCount} tier agents + 1 orchestrator + copilot-instructions (pin=${pinModel}; .github/ mirror regenerated)`);
