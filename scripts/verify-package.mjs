#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const markdownFiles = ['SKILL.md', ...fs.readdirSync(path.join(root, 'docs'))
  .filter((file) => file.endsWith('.md'))
  .map((file) => path.join('docs', file))];
const references = new Set();

for (const markdownFile of markdownFiles) {
  const contents = fs.readFileSync(path.join(root, markdownFile), 'utf8');
  for (const match of contents.matchAll(/(?:bash\s+)?(scripts\/[A-Za-z0-9._/-]+\.(?:sh|mjs|js))/g)) {
    references.add(match[1]);
  }
}

if (references.size === 0) {
  throw new Error('Packaged documentation does not reference a validation executable');
}

for (const reference of references) {
  const executable = path.join(root, reference);
  fs.accessSync(executable, fs.constants.R_OK);
  if (reference.endsWith('.sh')) {
    fs.accessSync(executable, fs.constants.X_OK);
  }
}

console.log(`Verified ${references.size} documented package executable(s): ${[...references].join(', ')}`);
