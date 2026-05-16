import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';

test('npm package dry-run contains the publishable runtime surface', () => {
  const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: packageRoot,
    encoding: 'utf8',
    shell: isWindows,
  });

  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);

  const [pack] = JSON.parse(result.stdout);
  const files = new Set(pack.files.map((file) => file.path));

  assert.equal(pack.name, 'lino-i18n');
  assert.equal(pack.version, '0.0.1');
  assert.equal(pack.bundled.length, 0);

  assert.ok(files.has('README.md'));
  assert.ok(files.has('CHANGELOG.md'));
  assert.ok(files.has('LICENSE'));
  assert.ok(files.has('bin/lino-i18n.js'));
  assert.ok(files.has('src/index.js'));
  assert.ok(files.has('src/index.d.ts'));
  assert.ok(files.has('src/loaders.js'));
  assert.ok(!files.has('tests/i18n.test.js'));
  assert.ok(!files.has('scripts/publish-to-npm.mjs'));
});
