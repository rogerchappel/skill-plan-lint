#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { analyzeSkill, renderMarkdown } from './index.js';
function files(input) {
  const stat = fs.statSync(input);
  if (stat.isDirectory()) {
    return fs.readdirSync(input, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap((entry) => {
        const child = path.join(input, entry.name);
        if (entry.isDirectory()) return files(child);
        return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [child] : [];
      });
  }
  return [input];
}
const [cmd = 'check', target = 'SKILL.md', ...rest] = process.argv.slice(2);
if (cmd === '--help' || cmd === '-h') {
  console.log('Usage: skill-plan-lint check <file-or-directory> [--markdown]');
  process.exit(0);
}
const markdown = rest.includes('--format=markdown') || rest.includes('--markdown');
if (!['check', 'report'].includes(cmd)) { console.error('Usage: skill-plan-lint check <file-or-directory> [--markdown]'); process.exit(2); }
const reports = files(target).map((file) => analyzeSkill(fs.readFileSync(file, 'utf8'), file));
if (reports.length === 0) {
  console.error(`No Markdown files found in ${target}`);
  process.exit(2);
}
if (markdown || cmd === 'report') console.log(reports.map(renderMarkdown).join('\n'));
else console.log(JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 2));
if (cmd === 'check' && reports.some((report) => report.status === 'revise')) process.exit(1);
