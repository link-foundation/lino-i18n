#!/usr/bin/env node
import { relative, resolve } from 'node:path';
import { realpathSync } from 'node:fs';
import { getJsRoot, parseJsRootConfig } from './js-paths.mjs';
import { getPrComparison, git } from './pr-comparison.mjs';

try {
  const { mergeBase, head } = getPrComparison();
  const repository = realpathSync.native(git(['rev-parse', '--show-toplevel']));
  const manifest = relative(
    repository,
    realpathSync.native(
      resolve(getJsRoot({ jsRoot: parseJsRootConfig() }), 'package.json')
    )
  ).replaceAll('\\', '/');
  const read = (commit) =>
    JSON.parse(git(['show', `${commit}:${manifest}`])).version;
  if (read(mergeBase) !== read(head)) {
    throw new Error(
      `Manual version change in ${manifest}; add a changeset instead.`
    );
  }
  console.log('Package version is unchanged.');
} catch (error) {
  console.error(`::error::${error.message}`);
  process.exitCode = 1;
}
