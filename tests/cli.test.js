import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

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
