const REQUIRED = [
  { id: 'when-to-use', label: 'When to use', weight: 15, patterns: [/when to use/i, /trigger/i, /use this skill/i] },
  { id: 'inputs-tools', label: 'Inputs and tools', weight: 15, patterns: [/input/i, /required tool/i, /provide/i] },
  { id: 'side-effects', label: 'Side-effect boundaries', weight: 15, patterns: [/side.?effect/i, /local-only/i, /do not/i, /mutate/i] },
  { id: 'approval', label: 'Approval requirements', weight: 15, patterns: [/approval/i, /confirm/i, /permission/i] },
  { id: 'examples', label: 'Examples', weight: 10, patterns: [/example/i, /`[^`]+`/] },
  { id: 'validation', label: 'Validation workflow', weight: 15, patterns: [/validation/i, /verify/i, /test/i, /smoke/i] },
  { id: 'limitations', label: 'Limitations and fallback', weight: 15, patterns: [/limitation/i, /fallback/i, /out of scope/i] }
];

const APPROVAL_NEGATIONS = [
  /\bno\s+(?:approval|confirmation|permission)\b/i,
  /\b(?:approval|confirmation|permission)\s+(?:is|are)\s+not\s+(?:needed|required|necessary)\b/i,
  /\bno\s+need\s+for\s+(?:\w+\s+){0,2}(?:approval|confirmation|permission)\b/i,
  /\bwithout\s+(?:\w+\s+){0,2}(?:approval|confirmation|permission)\b/i,
  /\b(?:never|do\s+not|don't)\s+(?:ask|request|require|obtain|seek)\b.*\b(?:approval|confirmation|permission)\b/i,
  /\b(?:approval|confirmation|permission)\s+is\s+optional\b/i
];

const AFFIRMATIVE_APPROVALS = [
  /\b(?:approval|confirmation|permission)\s+(?:from\s+(?:the\s+)?\w+\s+)?(?:is|are)\s+(?:explicitly\s+)?required\b/i,
  /\brequir(?:e|es|ed|ing)\b.*\b(?:approval|confirmation|permission)\b/i,
  /\b(?:ask\s+for|obtain|request|secure|seek|receive)\b.*\b(?:approval|confirmation|permission)\b/i,
  /\b(?:only|solely)\s+after\b.*\b(?:approval|confirmation|permission)\b/i
];

const RISKY_SIDE_EFFECT = /\b(?:delet(?:e|es|ed|ing)|remov(?:e|es|ed|ing)|overwrit(?:e|es|ten|ing)|destroy(?:s|ed|ing)?|eras(?:e|es|ed|ing)|publish(?:es|ed|ing)?|deploy(?:s|ed|ing)?)\b|\blive\s+(?:write|writes|change|changes|update|updates|mutation|mutations)\b|\b(?:write|change|update|mutate)(?:s|d|ing)?\s+(?:a\s+)?live\b/i;
const NEGATED_SIDE_EFFECT = /\b(?:do(?:es)?\s+not|must\s+not|never)\s+(?:\w+\s+){0,3}(?:delete|remove|overwrite|destroy|erase|publish|deploy|write|change|update|mutate)\b/i;

function isAffirmativeApproval(line) {
  return !APPROVAL_NEGATIONS.some((pattern) => pattern.test(line))
    && AFFIRMATIVE_APPROVALS.some((pattern) => pattern.test(line));
}

function hasRiskySideEffect(lines) {
  return lines.some((line) => RISKY_SIDE_EFFECT.test(line) && !NEGATED_SIDE_EFFECT.test(line));
}

export function analyzeSkill(text, file = '<input>') {
  const lines = String(text || '').split(/\r?\n/);
  const checks = REQUIRED.map((rule) => {
    const evidence = [];
    lines.forEach((line, index) => {
      const matches = rule.id === 'approval'
        ? isAffirmativeApproval(line)
        : rule.patterns.some((pattern) => pattern.test(line));
      if (matches) evidence.push({ line: index + 1, text: line.trim().slice(0, 160) });
    });
    return { id: rule.id, label: rule.label, weight: rule.weight, passed: evidence.length > 0, evidence };
  });
  const score = checks.filter((check) => check.passed).reduce((sum, check) => sum + check.weight, 0);
  const approvalPassed = checks.find((check) => check.id === 'approval').passed;
  const unsafeWithoutApproval = hasRiskySideEffect(lines) && !approvalPassed;
  const status = unsafeWithoutApproval ? 'revise' : score >= 85 ? 'ship' : score >= 60 ? 'incubate' : 'revise';
  return { file, score, status, checks };
}
export function renderMarkdown(report) {
  const rows = report.checks.map((check) => `| ${check.passed ? 'pass' : 'missing'} | ${check.label} | ${check.evidence[0]?.line || ''} |`).join('\n');
  return `# Skill lint report\n\nFile: ${report.file}\nScore: ${report.score}\nStatus: ${report.status}\n\n| Result | Check | Evidence line |\n|---|---|---:|\n${rows}\n`;
}
