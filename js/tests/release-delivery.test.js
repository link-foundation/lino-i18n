import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { buildReleasePayload } from '../scripts/create-github-release.mjs';

const jsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(jsRoot, '..');

function readRepoFile(...pathParts) {
  return readFileSync(resolve(repoRoot, ...pathParts), 'utf8').replaceAll(
    '\r\n',
    '\n'
  );
}

function extractWorkflowJob(workflow, jobName) {
  const pattern = new RegExp(
    `\\n  ${jobName}:\\n[\\s\\S]*?(?=\\n  [a-zA-Z0-9_-]+:\\n|\\n$)`
  );
  const match = workflow.match(pattern);

  assert.ok(match, `expected workflow job ${jobName} to exist`);
  return match[0];
}

test('delivery jobs keep running after optional release gates are skipped', () => {
  const jsWorkflow = readRepoFile('.github/workflows/js.yml');
  const rustWorkflow = readRepoFile('.github/workflows/rust.yml');

  const jsPackage = extractWorkflowJob(jsWorkflow, 'package');
  assert.match(jsPackage, /always\(\) && !cancelled\(\)/);
  assert.match(jsPackage, /needs\.test\.result == 'success'/);
  assert.match(jsPackage, /needs\.cli-smoke-test\.result == 'success'/);

  const jsRelease = extractWorkflowJob(jsWorkflow, 'auto-release');
  assert.match(jsRelease, /always\(\) && !cancelled\(\)/);
  assert.match(jsRelease, /needs\.package\.result == 'success'/);

  const rustPackage = extractWorkflowJob(rustWorkflow, 'package');
  assert.match(rustPackage, /always\(\) && !cancelled\(\)/);
  assert.match(rustPackage, /needs\.lint\.result == 'success'/);
  assert.match(rustPackage, /needs\.test\.result == 'success'/);

  const rustRelease = extractWorkflowJob(rustWorkflow, 'auto-release');
  assert.match(rustRelease, /always\(\) && !cancelled\(\)/);
  assert.match(rustRelease, /needs\.package\.result == 'success'/);
});

test('root README advertises package, release, and CI/CD status badges', () => {
  const readme = readRepoFile('README.md');

  assert.match(readme, /actions\/workflows\/js\.yml\/badge\.svg\?branch=main/);
  assert.match(
    readme,
    /actions\/workflows\/rust\.yml\/badge\.svg\?branch=main/
  );
  assert.match(readme, /img\.shields\.io\/npm\/v\/lino-i18n\?label=npm/);
  assert.match(
    readme,
    /img\.shields\.io\/crates\/v\/lino-i18n\?label=crates\.io/
  );
  assert.match(readme, /docs\.rs\/lino-i18n\/badge\.svg/);
  assert.match(
    readme,
    /img\.shields\.io\/github\/v\/release\/link-foundation\/lino-i18n/
  );
});

test('Rust local path dependencies match the workspace package version', () => {
  const workspaceManifest = readRepoFile('rust/Cargo.toml');
  const runtimeManifest = readRepoFile('rust/lino-i18n/Cargo.toml');
  const cargoLock = readRepoFile('rust/Cargo.lock');

  const workspaceVersion = workspaceManifest.match(
    /\[workspace\.package\][\s\S]*?\nversion\s*=\s*"([^"]+)"/
  )?.[1];
  assert.ok(workspaceVersion, 'expected Rust workspace version to be declared');

  const macrosDependency = runtimeManifest.match(
    /^lino-i18n-macros\s*=\s*\{([^}]+)\}/m
  )?.[1];
  assert.ok(macrosDependency, 'expected lino-i18n-macros dependency');
  assert.match(macrosDependency, /path\s*=\s*"..\/lino-i18n-macros"/);

  const macrosVersion = macrosDependency.match(/version\s*=\s*"([^"]+)"/)?.[1];
  assert.equal(macrosVersion, workspaceVersion);

  for (const packageName of ['lino-i18n', 'lino-i18n-macros']) {
    const packageBlock = cargoLock
      .split(/\n(?=\[\[package\]\])/)
      .find((block) => block.includes(`name = "${packageName}"`));
    assert.ok(packageBlock, `expected ${packageName} in Cargo.lock`);

    const lockVersion = packageBlock.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
    assert.equal(lockVersion, workspaceVersion);
  }
});

test('JavaScript GitHub release notes include package and CI/CD badges', () => {
  const payload = JSON.parse(
    buildReleasePayload({
      changelog: '## 0.0.1\n\nInitial release',
      language: 'JavaScript',
      packageName: 'lino-i18n',
      repository: 'link-foundation/lino-i18n',
      tag: 'js-v0.0.1',
      version: '0.0.1',
      workflowFile: 'js.yml',
    })
  );

  assert.match(payload.body, /img\.shields\.io\/npm\/v\/lino-i18n\?label=npm/);
  assert.match(
    payload.body,
    /actions\/workflows\/js\.yml\/badge\.svg\?branch=main/
  );
  assert.match(payload.body, /Initial release/);
});
