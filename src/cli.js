#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { analyzeSkill, renderMarkdown } from './index.js';

const usage = `Usage: skill-plan-lint check [file-or-directory] [--markdown|--format=markdown]
       skill-plan-lint report [file-or-directory] [--markdown|--format=markdown]`;

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
  return input.toLowerCase().endsWith('.md') ? [input] : [];
}

const [cmd = 'check', ...args] = process.argv.slice(2);
if (cmd === '--help' || cmd === '-h') {
  console.log(usage);
  process.exit(0);
}
if (!['check', 'report'].includes(cmd)) {
  console.error(usage);
  process.exit(2);
}

const options = args.filter((arg) => arg.startsWith('-'));
const targets = args.filter((arg) => !arg.startsWith('-'));
const unknown = options.filter((option) => !['--markdown', '--format=markdown'].includes(option));
if (unknown.length > 0) {
  console.error(`Unknown option: ${unknown[0]}`);
  console.error(usage);
  process.exit(2);
}
if (targets.length > 1) {
  console.error('Expected at most one file or directory target');
  console.error(usage);
  process.exit(2);
}

const target = targets[0] ?? 'SKILL.md';
const markdown = options.includes('--format=markdown') || options.includes('--markdown');
let discovered;
try {
  discovered = files(target);
} catch (error) {
  const reason = error?.code === 'ENOENT' ? 'not found' : 'not readable';
  console.error(`Target ${reason}: ${target}`);
  process.exit(2);
}
if (discovered.length === 0 && fs.statSync(target).isFile()) {
  console.error(`Target must be a Markdown file or directory: ${target}`);
  process.exit(2);
}
let reports;
try {
  reports = discovered.map((file) => analyzeSkill(fs.readFileSync(file, 'utf8'), file));
} catch {
  console.error(`Target not readable: ${target}`);
  process.exit(2);
}
if (reports.length === 0) {
  console.error(`No Markdown files found in ${target}`);
  process.exit(2);
}
if (markdown || cmd === 'report') console.log(reports.map(renderMarkdown).join('\n'));
else console.log(JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 2));
if (cmd === 'check' && reports.some((report) => report.status !== 'ship')) process.exit(1);
