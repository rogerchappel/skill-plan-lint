import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('CLI help exits cleanly with usage text', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', '--help'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /Usage: skill-plan-lint check/);
});

test('CLI rejects unknown commands with usage text', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', 'nope'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage: skill-plan-lint check/);
});

test('CLI rejects unknown options', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', 'report', 'README.md', '--bogus'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^Unknown option: --bogus\nUsage:/);
});

test('CLI rejects multiple targets', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', 'check', 'README.md', 'SKILL.md'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /^Expected at most one/);
});

test('CLI reports a missing target without a stack trace', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', 'check', 'does-not-exist.md'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'Target not found: does-not-exist.md\n');
});

test('CLI rejects an explicit non-Markdown file', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', 'check', 'package.json'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'Target must be a Markdown file or directory: package.json\n');
});

test('CLI fails a destructive skill with negated approval language', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', 'check', 'fixtures/unsafe-negated-approval.md'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });

  const report = JSON.parse(result.stdout);
  assert.equal(result.status, 1);
  assert.equal(report.status, 'revise');
  assert.equal(report.checks.find((check) => check.id === 'approval').passed, false);
});

test('CLI fails an otherwise 85-point skill without affirmative approval', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-plan-lint-required-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const fixture = path.join(directory, 'missing-approval.md');
  const skill = fs.readFileSync(new URL('../fixtures/good-skill.md', import.meta.url), 'utf8')
    .replace('Approval is required before applying or rejecting a proposal.', '');
  fs.writeFileSync(fixture, skill);

  const result = spawnSync(process.execPath, ['src/cli.js', 'check', fixture], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });

  const report = JSON.parse(result.stdout);
  assert.equal(report.score, 85);
  assert.equal(report.status, 'incubate');
  assert.equal(report.checks.find((check) => check.id === 'approval').passed, false);
  assert.equal(result.status, 1);
});

test('CLI fails when approval evidence names an unrelated risky action', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-plan-lint-scope-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const fixture = path.join(directory, 'unscoped-approval.md');
  const skill = fs.readFileSync(new URL('../fixtures/good-skill.md', import.meta.url), 'utf8')
    .replace('Approval is required before applying or rejecting a proposal.', 'Approval is required before deleting files.')
    .concat('\nSide effects: send an email immediately.\n');
  fs.writeFileSync(fixture, skill);

  const result = spawnSync(process.execPath, ['src/cli.js', 'check', fixture], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });

  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).status, 'revise');
});

test('CLI recursively reports nested Markdown in deterministic order', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-plan-lint-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, 'z-nested'));
  fs.writeFileSync(path.join(directory, 'z-nested', 'SKILL.md'), '# Nested\n');
  fs.writeFileSync(path.join(directory, 'a.md'), '# First\n');

  const result = spawnSync(process.execPath, ['src/cli.js', 'report', directory], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });

  assert.equal(result.status, 0);
  assert.ok(result.stdout.indexOf('a.md') < result.stdout.indexOf('z-nested/SKILL.md'));
});

test('CLI rejects a directory without auditable Markdown', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-plan-lint-empty-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'notes.txt'), 'not Markdown');

  const result = spawnSync(process.execPath, ['src/cli.js', 'check', directory], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /No Markdown files found/);
});
