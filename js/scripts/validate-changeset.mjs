#!/usr/bin/env bun

/**
 * Validate changeset for CI - ensures exactly one valid changeset is added by the PR
 *
 * Key behavior:
 * - Only checks changeset files ADDED by the current PR (not pre-existing ones)
 * - Uses git diff to compare PR head against base branch
 * - Validates that the PR adds exactly one changeset with proper format
 * - Falls back to checking all changesets for local development
 */

import { getPrChanges, getPrComparison, git } from './pr-comparison.mjs';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

import { getChangesetDir, getJsRoot, parseJsRootConfig } from './js-paths.mjs';
import {
  getChangesetVersionTypeRegex,
  readPackageInfo,
} from './package-info.mjs';

/** Only genuinely added fragments from the complete PR can satisfy CI. */
function getAddedChangesetFiles(changesetDir) {
  const hasContext =
    process.env.GITHUB_EVENT_NAME === 'pull_request' ||
    process.env.GITHUB_BASE_SHA ||
    process.env.GITHUB_BASE_REF;
  if (!hasContext) {
    return existsSync(changesetDir)
      ? readdirSync(changesetDir).filter(
          (file) => file.endsWith('.md') && file !== 'README.md'
        )
      : [];
  }
  const prefix = git(['rev-parse', '--show-prefix']);
  const directory = `${prefix}${changesetDir.replace(/^\.\//, '')}/`;
  return getPrChanges(getPrComparison())
    .filter(
      ({ status, path }) =>
        status === 'A' &&
        path.startsWith(directory) &&
        path.endsWith('.md') &&
        !path.endsWith('/README.md')
    )
    .map(({ path }) => path.slice(directory.length));
}

/**
 * Validate a single changeset file
 * @param {string} filePath Full path to the changeset file
 * @param {string} packageName
 * @returns {{valid: boolean, type?: string, description?: string, error?: string}}
 */
function validateChangesetFile(filePath, packageName) {
  try {
    const content = readFileSync(filePath, 'utf-8');

    // Check if changeset has a valid type (major, minor, or patch)
    const versionTypeRegex = getChangesetVersionTypeRegex(packageName);
    const versionTypeMatch = content.match(versionTypeRegex);

    if (!versionTypeMatch) {
      return {
        valid: false,
        error: `Changeset must specify a version type: major, minor, or patch\nExpected format:\n---\n'${packageName}': patch\n---\n\nYour description here`,
      };
    }

    // Extract description (everything after the closing ---) and check it's not empty
    const parts = content.split('---');
    if (parts.length < 3) {
      return {
        valid: false,
        error:
          "Changeset must include a description of the changes (after the closing '---')",
      };
    }

    const description = parts.slice(2).join('---').trim();
    if (!description) {
      return {
        valid: false,
        error: 'Changeset must include a non-empty description of the changes',
      };
    }

    return {
      valid: true,
      type: versionTypeMatch[1],
      description,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to read changeset file: ${error.message}`,
    };
  }
}

try {
  console.log('Validating changesets added by this PR...');
  const jsRootConfig = parseJsRootConfig();
  const jsRoot = getJsRoot({ jsRoot: jsRootConfig, verbose: true });
  const changesetDir = getChangesetDir({ jsRoot });
  const { name: packageName } = readPackageInfo({ jsRoot });
  console.log(`Package: ${packageName}`);

  // Get changeset files added in this PR
  const addedChangesetFiles = getAddedChangesetFiles(changesetDir);
  const changesetCount = addedChangesetFiles.length;

  console.log(`Found ${changesetCount} changeset file(s) added by this PR`);
  if (changesetCount > 0) {
    console.log('Added changesets:');
    addedChangesetFiles.forEach((file) => console.log(`  - ${file}`));
  }

  // Ensure exactly one changeset file was added
  if (changesetCount === 0) {
    console.error(
      "::error::No changeset found in this PR. Please add a changeset by running 'npm run changeset' and commit the result."
    );
    process.exit(1);
  } else if (changesetCount > 1) {
    console.error(
      `::error::Multiple changesets found in this PR (${changesetCount}). Each PR should add exactly ONE changeset.`
    );
    console.error('::error::Found changeset files added by this PR:');
    addedChangesetFiles.forEach((file) => console.error(`  ${file}`));
    console.error(
      '\n::error::Please combine these into a single changeset or remove the extras.'
    );
    process.exit(1);
  }

  // Validate the single changeset file
  const changesetFile = join(changesetDir, addedChangesetFiles[0]);
  console.log(`Validating changeset: ${changesetFile}`);

  const validation = validateChangesetFile(changesetFile, packageName);

  if (!validation.valid) {
    console.error(`::error::${validation.error}`);
    console.error(`\nFile content of ${changesetFile}:`);
    try {
      console.error(readFileSync(changesetFile, 'utf-8'));
    } catch {
      console.error('(could not read file)');
    }
    process.exit(1);
  }

  console.log('Changeset validation passed');
  console.log(`   Type: ${validation.type}`);
  console.log(`   Description: ${validation.description}`);
} catch (error) {
  console.error('Error during changeset validation:', error.message);
  if (process.env.DEBUG) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
