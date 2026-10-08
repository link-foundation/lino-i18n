import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { NPM_RECOVERY_VERSION, recoverNpm } from '../scripts/setup-npm.mjs';

const jsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('actual JS release syncs a detached validated checkout before versioning', (t) => {
  const temporary = mkdtempSync(resolve(tmpdir(), 'lino-js-release-'));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const remote = resolve(temporary, 'remote.git');
  const cwd = resolve(temporary, 'repo');
  const git = (...args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', remote]);
  execFileSync('git', ['clone', '-q', remote, cwd], { stdio: 'ignore' });
  git('config', 'user.name', 'Test');
  git('config', 'user.email', 'test@example.com');
  git('config', 'core.autocrlf', 'false');
  const write = (name, content) => {
    mkdirSync(dirname(resolve(cwd, name)), { recursive: true });
    writeFileSync(resolve(cwd, name), content);
  };
  write('.gitignore', 'node_modules/\n');
  write('js/package.json', '{"name":"fixture","version":"1.0.0"}\n');
  write(
    'js/package-lock.json',
    '{"name":"fixture","version":"1.0.0","lockfileVersion":3,"packages":{"":{"name":"fixture","version":"1.0.0"}}}\n'
  );
  write('js/CHANGELOG.md', '# Changelog\n');
  write(
    'js/.changeset/config.json',
    '{"changelog":false,"commit":false,"fixed":[],"linked":[],"access":"public","baseBranch":"main","updateInternalDependencies":"patch","ignore":[]}\n'
  );
  write(
    'js/.changeset/fix.md',
    '---\n"fixture": patch\n---\nRepair release.\n'
  );
  write('rust/Cargo.toml', '[workspace.package]\nversion="1.0.0"\n');
  mkdirSync(resolve(cwd, 'scripts'));
  copyFileSync(
    resolve(jsRoot, '../scripts/check-release-metadata.py'),
    resolve(cwd, 'scripts/check-release-metadata.py')
  );
  symlinkSync(
    resolve(jsRoot, 'node_modules'),
    resolve(cwd, 'js/node_modules'),
    'junction'
  );
  const alias = resolve(temporary, 'package-alias');
  symlinkSync(resolve(cwd, 'js'), alias, 'junction');
  git('add', '.');
  git('commit', '-qm', 'validated tree');
  const validated = git('rev-parse', 'HEAD');
  git('push', '-q', 'origin', 'main');
  write('rust/Cargo.toml', '[workspace.package]\nversion="1.0.1"\n');
  git('commit', '-qam', 'concurrent Rust release');
  const concurrent = git('rev-parse', 'HEAD');
  git('push', '-q', 'origin', 'main');
  git('checkout', '-q', '--detach', validated);
  const result = spawnSync(
    'node',
    [resolve(jsRoot, 'scripts/version-and-commit.mjs'), '--js-root', alias],
    {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_SHA: validated,
        GITHUB_REF: 'refs/heads/main',
        GITHUB_OUTPUT: '',
        MODE: 'changeset',
        JS_ROOT: '',
      },
    }
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(git('status', '--porcelain'), '');
  assert.equal(git('rev-parse', 'HEAD^'), concurrent);
  const manifest = JSON.parse(
    readFileSync(resolve(cwd, 'js/package.json'), 'utf8')
  );
  const lock = JSON.parse(
    readFileSync(resolve(cwd, 'js/package-lock.json'), 'utf8')
  );
  assert.equal(manifest.version, '1.0.1');
  assert.equal(lock.packages[''].version, manifest.version);
  assert.equal(git('ls-files', 'js/.changeset/fix.md'), '');
  assert.equal(git('rev-parse', 'origin/main'), git('rev-parse', 'HEAD'));
});

test('npm recovery rejects tampered archive bytes before invoking commands', async () => {
  let commands = 0;
  const fetchFn = async (url) => {
    if (url.endsWith(`/npm/${NPM_RECOVERY_VERSION}`)) {
      return {
        ok: true,
        json: async () => ({
          version: NPM_RECOVERY_VERSION,
          dist: {
            integrity: 'sha512-invalid',
            tarball: `https://registry.npmjs.org/npm/-/npm-${NPM_RECOVERY_VERSION}.tgz`,
          },
        }),
      };
    }
    return {
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    };
  };
  await assert.rejects(
    recoverNpm({
      fetchFn,
      runner: async () => {
        commands++;
      },
    }),
    /integrity mismatch/
  );
  assert.equal(commands, 0);
});

test('merging changesets rejects an invalid fragment before changing files', (t) => {
  const cwd = mkdtempSync(resolve(tmpdir(), 'lino-invalid-changeset-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  mkdirSync(resolve(cwd, '.changeset'));
  writeFileSync(
    resolve(cwd, 'package.json'),
    '{"name":"fixture","version":"1.0.0"}'
  );
  const valid = '---\n"fixture": patch\n---\nValid fix.\n';
  writeFileSync(resolve(cwd, '.changeset/valid.md'), valid);
  writeFileSync(
    resolve(cwd, '.changeset/invalid.md'),
    'Malformed changeset.\n'
  );
  const result = spawnSync(
    'node',
    [resolve(jsRoot, 'scripts/merge-changesets.mjs'), '--js-root', cwd],
    { cwd, encoding: 'utf8' }
  );
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  assert.equal(
    readFileSync(resolve(cwd, '.changeset/valid.md'), 'utf8'),
    valid
  );
  assert.equal(
    readFileSync(resolve(cwd, '.changeset/invalid.md'), 'utf8'),
    'Malformed changeset.\n'
  );
});
