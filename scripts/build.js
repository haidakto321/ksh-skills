const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const fm = require(path.join(root, 'shared', 'frontmatter.json'));
const cfg = require(path.join(root, 'shared', 'copilot-models.json'));
const tierModels = cfg.weights;          // { light, normal, heavy } -> Copilot model name
const pinModel = cfg.pin !== false;      // pin tier model into each prompt? (default true)
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
  const model = tierModels[fm[skill].weight]; // Copilot model for this skill's tier

  // Claude SKILL.md
  const skillMd = `---\nname: ${name}\ndescription: ${desc}\n---\n\n${body}`;
  write(path.join(root, 'skills', skill, 'SKILL.md'), skillMd);

  // Claude plugin command wrapper (thin: points at the skill).
  // Must live in commands/ at the plugin root - .claude/commands/ is project-only
  // and is NOT packaged when installed as a plugin.
  const cmd = `---\ndescription: ${desc}\n---\n\nInvoke the ${name} skill and follow it exactly.\n`;
  write(path.join(root, 'commands', `${skill}.md`), cmd);

  // Copilot prompt file. When pinModel is true, model: hard-sets the tier model
  // (auto routing); when false, model: is omitted so the user's picked model runs.
  const modelLine = pinModel ? `model: ${JSON.stringify(model)}\n` : '';
  const prompt = `---\nagent: 'agent'\n${modelLine}description: ${desc}\n---\n\n${body}`;
  write(path.join(root, 'copilot', '.github', 'prompts', `${skill}.prompt.md`), prompt);
}

// Copilot custom agents - one per weight tier. Each pins its tier model and is a
// handoff target for the orchestrator (so a simple step runs on a lighter model).
for (const weight of Object.keys(tierModels)) {
  const desc = JSON.stringify(`aisp ${weight}-tier agent - runs ${weight} steps on the ${weight} model.`);
  const agent = `---\nname: aisp-${weight}\ndescription: ${desc}\nmodel: ${JSON.stringify(tierModels[weight])}\n---\n\nRun the requested aisp step on the ${weight} tier. Follow the invoking skill's process and gates exactly.\n`;
  write(path.join(root, 'copilot', '.github', 'agents', `aisp-${weight}.agent.md`), agent);
}

// Copilot orchestrator agent with gated handoffs. Each handoff is a button the
// human clicks to advance one step (= the human gate; send:false never
// auto-submits), and each runs on the target tier's model via a tier agent.
const FLOW = [
  ['aisp-spec', 'light'], ['aisp-plan', 'normal'], ['aisp-code', 'normal'],
  ['aisp-test', 'normal'], ['aisp-review', 'heavy'], ['aisp-doc', 'light'],
];
// No per-handoff model: each handoff targets its tier agent, whose own `model`
// (a fallback list) decides the model. This avoids assuming the handoff model
// field accepts an array, and the tier agent already carries the fallback chain.
const handoffs = FLOW.map(([step, weight]) => {
  const label = step.replace('aisp-', '');
  return [
    `  - label: ${JSON.stringify(label[0].toUpperCase() + label.slice(1))}`,
    `    agent: aisp-${weight}`,
    `    prompt: ${JSON.stringify(`Run the ${step} step now. Follow its process and gates exactly.`)}`,
    `    send: false`,
  ].join('\n');
}).join('\n');
const orchBody = read(path.join(root, 'shared', 'aisp.body.md')).trimEnd() + '\n';
const orchestrator = `---\nname: aisp\ndescription: ${JSON.stringify('aisp SDLC orchestrator - gated spec to doc flow; each handoff advances one step on its tier model.')}\nmodel: ${JSON.stringify(tierModels.normal)}\nhandoffs:\n${handoffs}\n---\n\n${orchBody}`;
write(path.join(root, 'copilot', '.github', 'agents', `aisp.agent.md`), orchestrator);

const tierCount = Object.keys(tierModels).length;
console.log(`BUILD OK: generated ${Object.keys(fm).length} skills x 3 outputs + ${tierCount} tier agents + 1 orchestrator agent (pin=${pinModel})`);
