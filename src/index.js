const REQUIRED = [
  { id: 'when-to-use', label: 'When to use', weight: 15, patterns: [/when to use/i, /trigger/i, /use this skill/i] },
  { id: 'inputs-tools', label: 'Inputs and tools', weight: 15, patterns: [/input/i, /required tool/i, /provide/i] },
  { id: 'side-effects', label: 'Side-effect boundaries', weight: 15, patterns: [/side.?effect/i, /local-only/i, /do not/i, /mutate/i] },
  { id: 'approval', label: 'Approval requirements', weight: 15, patterns: [/approval/i, /confirm/i, /permission/i] },
  { id: 'examples', label: 'Examples', weight: 10, patterns: [/example/i, /`[^`]+`/] },
  { id: 'validation', label: 'Validation workflow', weight: 15, patterns: [/validation/i, /verify/i, /test/i, /smoke/i] },
  { id: 'limitations', label: 'Limitations and fallback', weight: 15, patterns: [/limitation/i, /fallback/i, /out of scope/i] }
];
export function analyzeSkill(text, file = '<input>') {
  const lines = String(text || '').split(/\r?\n/);
  const checks = REQUIRED.map((rule) => {
    const evidence = [];
    lines.forEach((line, index) => {
      if (rule.patterns.some((pattern) => pattern.test(line))) evidence.push({ line: index + 1, text: line.trim().slice(0, 160) });
    });
    return { id: rule.id, label: rule.label, weight: rule.weight, passed: evidence.length > 0, evidence };
  });
  const score = checks.filter((check) => check.passed).reduce((sum, check) => sum + check.weight, 0);
  const status = score >= 85 ? 'ship' : score >= 60 ? 'incubate' : 'revise';
  return { file, score, status, checks };
}
export function renderMarkdown(report) {
  const rows = report.checks.map((check) => `| ${check.passed ? 'pass' : 'missing'} | ${check.label} | ${check.evidence[0]?.line || ''} |`).join('\n');
  return `# Skill lint report\n\nFile: ${report.file}\nScore: ${report.score}\nStatus: ${report.status}\n\n| Result | Check | Evidence line |\n|---|---|---:|\n${rows}\n`;
}
