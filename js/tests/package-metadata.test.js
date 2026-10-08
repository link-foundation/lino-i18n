import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(
  readFileSync(resolve(packageRoot, 'package.json'), 'utf8')
);
test('npm package dry-run contains the publishable runtime surface', () => {
  // npm is a .cmd shim on Windows. A fixed command needs no unescaped args.
  const result = spawnSync('npm pack --dry-run --json', {
    cwd: packageRoot,
    encoding: 'utf8',
    shell: true,
  });

  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);

  const [pack] = JSON.parse(result.stdout);
  const files = new Set(pack.files.map((file) => file.path));

  assert.equal(pack.name, 'lino-i18n');
  assert.equal(pack.version, packageJson.version);
  assert.equal(pack.bundled.length, 0);

  assert.ok(files.has('README.md'));
  assert.ok(files.has('CHANGELOG.md'));
  assert.ok(files.has('LICENSE'));
  assert.ok(files.has('bin/lino-i18n.js'));
  assert.ok(files.has('src/index.js'));
  assert.ok(files.has('src/index.d.ts'));
  assert.ok(files.has('src/browser.js'));
  assert.ok(files.has('src/browser.d.ts'));
  assert.ok(files.has('src/catalogs.js'));
  assert.equal(packageJson.sideEffects, false);
  assert.deepEqual(packageJson.exports['./browser'], {
    types: './src/browser.d.ts',
    import: './src/browser.js',
  });
  assert.ok(files.has('src/loaders.js'));
  for (const subpath of [
    'messages',
    'intl',
    'server',
    'node',
    'react-server',
    'tooling',
    'compiler',
  ]) {
    const entry = packageJson.exports[`./${subpath}`];
    assert.ok(
      files.has(entry.import.slice(2)),
      `${subpath} runtime is published`
    );
    assert.ok(
      files.has(entry.types.slice(2)),
      `${subpath} declarations are published`
    );
  }
  assert.ok(!files.has('tests/i18n.test.js'));
  assert.ok(!files.has('scripts/publish-to-npm.mjs'));
});
