import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function fixture(t) {
  const cwd = mkdtempSync(resolve(tmpdir(), 'lino-ci-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
  const commit = (path, content = 'changed') => {
    mkdirSync(dirname(resolve(cwd, path)), { recursive: true });
    writeFileSync(resolve(cwd, path), content);
    git('add', path);
    git('commit', '-qm', path);
    return git('rev-parse', 'HEAD');
  };
  git('init', '-q', '-b', 'main');
  git('config', 'user.name', 'Test');
  git('config', 'user.email', 'test@example.com');
  git('config', 'core.autocrlf', 'false');
  commit('js/package.json', '{"name":"fixture","version":"1.0.0"}');
  const base = git('rev-parse', 'HEAD');
  return { cwd, git, commit, base };
}

function run(cwd, script, env = {}) {
  return spawnSync(process.execPath, [resolve(root, script)], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_OUTPUT: '',
      GITHUB_BASE_SHA: '',
      GITHUB_HEAD_SHA: '',
      GITHUB_BEFORE_SHA: '',
      ...env,
    },
  });
}

test('a main merge detects source changes before the final docs commit', (t) => {
  const { cwd, git, commit } = fixture(t);
  git('checkout', '-qb', 'feature');
  commit('js/src/index.js');
  commit('docs/example.md');
  git('checkout', '-q', 'main');
  git('merge', '--no-ff', '-qm', 'merge', 'feature');
  const result = run(cwd, 'scripts/detect-code-changes.mjs', {
    GITHUB_EVENT_NAME: 'push',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /any-code-changed=true/);
});

test('PR detection uses all commits, including when the last commit is docs', (t) => {
  const { cwd, git, commit, base } = fixture(t);
  git('checkout', '-qb', 'feature');
  commit('js/src/index.d.ts');
  const head = commit('docs/example.md');
  git('checkout', '-q', 'main');
  git('merge', '--no-ff', '-qm', 'merge', 'feature');
  const result = run(cwd, 'scripts/detect-code-changes.mjs', {
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_BASE_SHA: base,
    GITHUB_HEAD_SHA: head,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /any-code-changed=true/);
  assert.match(result.stdout, /js-changed=true/);
});

test('invalid explicit PR refs fail instead of reporting no changes', (t) => {
  const { cwd } = fixture(t);
  const result = run(cwd, 'scripts/detect-code-changes.mjs', {
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_BASE_SHA: 'missing-ref',
    GITHUB_HEAD_SHA: 'HEAD',
  });
  assert.notEqual(result.status, 0);
});

test('a dependency lock change triggers package validation', (t) => {
  const { cwd, commit } = fixture(t);
  commit('js/package-lock.json', '{}');
  const result = run(cwd, 'scripts/detect-code-changes.mjs', {
    GITHUB_EVENT_NAME: 'push',
  });
  assert.match(result.stdout, /package-changed=true/);
});

test('version guard catches monorepo changes and ignores manifest formatting', (t) => {
  const { cwd, git, commit, base } = fixture(t);
  const alias = resolve(cwd, 'package-alias');
  symlinkSync(resolve(cwd, 'js'), alias, 'junction');
  git('update-ref', 'refs/remotes/origin/main', base);
  commit(
    'js/package.json',
    '{\n  "name": "fixture",\n  "version": "1.0.0"\n}\n'
  );
  const env = {
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_BASE_SHA: base,
    GITHUB_HEAD_SHA: 'HEAD',
    JS_ROOT: alias,
  };
  assert.equal(run(cwd, 'scripts/check-version.mjs', env).status, 0);
  commit('js/package.json', '{"name":"fixture","version":"2.0.0"}');
  assert.notEqual(run(cwd, 'scripts/check-version.mjs', env).status, 0);
  assert.notEqual(
    run(cwd, 'scripts/check-version.mjs', {
      ...env,
      GITHUB_HEAD_REF: 'changeset-release/spoof',
    }).status,
    0
  );
});
