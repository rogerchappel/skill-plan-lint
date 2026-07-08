#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { analyzeSkill, renderMarkdown } from './index.js';
function files(input) {
  const stat = fs.statSync(input);
  if (stat.isDirectory()) return fs.readdirSync(input).filter((name) => name.endsWith('.md')).map((name) => path.join(input, name));
  return [input];
}
const [cmd = 'check', target = 'SKILL.md', ...rest] = process.argv.slice(2);
if (cmd === '--help' || cmd === '-h') {
  console.log('Usage: skill-plan-lint check <path> [--markdown]');
  process.exit(0);
}
const markdown = rest.includes('--format=markdown') || rest.includes('--markdown');
if (!['check', 'report'].includes(cmd)) { console.error('Usage: skill-plan-lint check <path> [--markdown]'); process.exit(2); }
const reports = files(target).map((file) => analyzeSkill(fs.readFileSync(file, 'utf8'), file));
if (markdown || cmd === 'report') console.log(reports.map(renderMarkdown).join('\n'));
else console.log(JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 2));
if (cmd === 'check' && reports.some((report) => report.score < 60)) process.exit(1);
