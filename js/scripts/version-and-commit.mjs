#!/usr/bin/env node
import { parseArgs } from 'node:util';
import {
  appendFileSync,
  readFileSync,
  writeFileSync,
  existsSync,
  realpathSync,
} from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getJsRoot } from './js-paths.mjs';
import { git } from './pr-comparison.mjs';
import { runStrict } from './run-command.mjs';

function setOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
}

try {
  const { values } = parseArgs({
    options: {
      mode: { type: 'string', default: process.env.MODE || 'changeset' },
      'bump-type': { type: 'string', default: process.env.BUMP_TYPE || '' },
      description: { type: 'string', default: process.env.DESCRIPTION || '' },
      'js-root': { type: 'string', default: process.env.JS_ROOT || '' },
    },
  });
  if (!['changeset', 'instant', 'sync'].includes(values.mode)) {
    throw new Error('Invalid version mode');
  }
  if (
    values.mode === 'instant' &&
    !['patch', 'minor', 'major'].includes(values['bump-type'])
  ) {
    throw new Error('Instant mode requires --bump-type patch|minor|major');
  }
  if (git(['status', '--porcelain'])) {
    throw new Error('Release requires a clean checkout');
  }
  if (
    !git(['branch', '--show-current']) &&
    process.env.GITHUB_REF === 'refs/heads/main'
  ) {
    await runStrict('git', ['switch', '-C', 'main', 'HEAD']);
  }
  if (git(['branch', '--show-current']) !== 'main') {
    throw new Error('Release requires the main branch');
  }
  const repository = realpathSync.native(git(['rev-parse', '--show-toplevel']));
  const jsRoot = realpathSync.native(getJsRoot({ jsRoot: values['js-root'] }));
  const packagePath = resolve(jsRoot, 'package.json');
  const metadataValidator = resolve(
    repository,
    'scripts/check-release-metadata.py'
  );
  const validated = process.env.GITHUB_SHA || git(['rev-parse', 'HEAD']);
  const sync = async (base) => {
    await runStrict('git', ['fetch', 'origin', 'main']);
    await runStrict('python3', [metadataValidator, base, 'origin/main'], {
      cwd: repository,
    });
    await runStrict('git', ['rebase', 'origin/main']);
  };
  await sync(validated);
  if (values.mode === 'sync') {
    process.exit(0);
  }
  const parent = git(['rev-parse', 'HEAD']);
  if (values.mode === 'instant') {
    await runStrict(process.execPath, [
      fileURLToPath(new URL('./instant-version-bump.mjs', import.meta.url)),
      '--js-root',
      jsRoot,
      '--bump-type',
      values['bump-type'],
      '--description',
      values.description,
    ]);
  } else {
    await runStrict(
      process.execPath,
      [fileURLToPath(new URL('./merge-changesets.mjs', import.meta.url))],
      { cwd: jsRoot }
    );
    await runStrict(
      process.execPath,
      [resolve(jsRoot, 'node_modules/@changesets/cli/bin.js'), 'version'],
      { cwd: jsRoot }
    );
  }
  const { version } = JSON.parse(readFileSync(packagePath, 'utf8'));
  const lockPath = resolve(jsRoot, 'package-lock.json');
  if (existsSync(lockPath)) {
    const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
    lock.version = version;
    if (lock.packages?.['']) {
      lock.packages[''].version = version;
    }
    writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  }
  const relativeRoot = relative(repository, jsRoot).replaceAll('\\', '/');
  const prefix = relativeRoot ? `${relativeRoot}/` : '';
  await runStrict(
    'git',
    [
      'add',
      '-A',
      '--',
      `${prefix}package.json`,
      `${prefix}package-lock.json`,
      `${prefix}CHANGELOG.md`,
      `${prefix}.changeset`,
    ],
    { cwd: repository }
  );
  await runStrict('python3', [metadataValidator, parent, '--', '--cached'], {
    cwd: repository,
  });
  if (git(['diff', '--cached', '--name-only'])) {
    await runStrict('git', ['config', 'user.name', 'github-actions[bot]']);
    await runStrict('git', [
      'config',
      'user.email',
      'github-actions[bot]@users.noreply.github.com',
    ]);
    await runStrict('git', ['commit', '-m', `chore: release js-v${version}`]);
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await runStrict('git', ['push', 'origin', 'HEAD:refs/heads/main']);
        break;
      } catch (error) {
        if (
          /(?:GH006|GH013|protected branch|repository rule)/i.test(
            error.message
          )
        ) {
          throw new Error(
            `Branch rules rejected the release metadata push; configure the approved bot bypass. ${error.message}`,
            { cause: error }
          );
        }
        if (
          attempt === 3 ||
          !/(?:non-fast-forward|fetch first)/i.test(error.message)
        ) {
          throw error;
        }
        await sync(parent);
      }
    }
    setOutput('version_committed', 'true');
  } else {
    setOutput('version_committed', 'false');
  }
  setOutput('new_version', version);
} catch (error) {
  console.error(`::error::${error.message}`);
  if (process.env.DEBUG === '1') {
    console.error(error.stack);
  }
  process.exitCode = 1;
}
