import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('packed artifact contains every executable referenced by packaged docs', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-plan-lint-pack-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  const packed = spawnSync('npm', ['pack', '--pack-destination', directory], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });
  assert.equal(packed.status, 0, packed.stderr);

  const archive = path.join(directory, fs.readdirSync(directory).find((file) => file.endsWith('.tgz')));
  const extracted = spawnSync('tar', ['-xzf', archive, '-C', directory], { encoding: 'utf8' });
  assert.equal(extracted.status, 0, extracted.stderr);

  const verified = spawnSync(process.execPath, ['scripts/verify-package.mjs', '.'], {
    cwd: path.join(directory, 'package'),
    encoding: 'utf8'
  });
  assert.equal(verified.status, 0, verified.stderr);
  assert.match(verified.stdout, /scripts\/validate\.sh/);
});
