#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJsRoot, parseJsRootConfig } from './js-paths.mjs';
import { runStrict } from './run-command.mjs';

try {
  const cwd = getJsRoot({ jsRoot: parseJsRootConfig() });
  await runStrict(
    process.execPath,
    [resolve(cwd, 'node_modules/@changesets/cli/bin.js'), 'version'],
    { cwd }
  );
  const { version } = JSON.parse(
    readFileSync(resolve(cwd, 'package.json'), 'utf8')
  );
  const path = resolve(cwd, 'package-lock.json');
  const lock = JSON.parse(readFileSync(path, 'utf8'));
  lock.version = version;
  if (lock.packages?.['']) {
    lock.packages[''].version = version;
  }
  writeFileSync(path, `${JSON.stringify(lock, null, 2)}\n`);
} catch (error) {
  console.error(`::error::${error.message}`);
  process.exitCode = 1;
}
