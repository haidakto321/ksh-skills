// Tool-specific marker blocks in shared bodies:
//   <!-- claude:start --> ... <!-- claude:end -->
//   <!-- copilot:start --> ... <!-- copilot:end -->
// renderFor keeps the target tool's blocks (markers removed) and drops the
// other tool's blocks entirely, so each generated file only carries text
// relevant to its runtime (token cost is paid per invoke).
const block = tool =>
  new RegExp(`[ \\t]*<!-- ${tool}:start -->\\r?\\n?([\\s\\S]*?)[ \\t]*<!-- ${tool}:end -->\\r?\\n?`, 'g');

function renderFor(target, body) {
  const other = target === 'claude' ? 'copilot' : 'claude';
  return body.replace(block(other), '').replace(block(target), '$1');
}

module.exports = { renderFor };
