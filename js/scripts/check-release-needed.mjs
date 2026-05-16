#!/usr/bin/env node

/**
 * Check if a release is needed based on changesets and npm registry state
 *
 * This script checks:
 * 1. If there are changeset files to process
 * 2. If the current version has already been published to npm
 * 3. If the matching GitHub Release exists
 *
 * IMPORTANT: This script checks npm (the source of truth for JS packages),
 * NOT git tags. This is critical because:
 * - Git tags can exist without the package being published
 * - GitHub releases create tags but don't publish to npm
 * - Only npm publication means users can actually install the package
 *
 * This provides a self-healing mechanism: if a previous release attempt
 * failed or was skipped, the next push to main will detect the incomplete
 * version and trigger a release without requiring a changeset.
 *
 * Analogous to check-release-needed.rs in the Rust template.
 *
 * Supports both single-language and multi-language repository structures:
 * - Single-language: package.json in repository root
 * - Multi-language: package.json in js/ subfolder
 *
 * Usage: node scripts/check-release-needed.mjs [--js-root <path>]
 *
 * Environment variables:
 *   - HAS_CHANGESETS: 'true' if changeset files exist (from check-changesets.mjs)
 *
 * Outputs (written to GITHUB_OUTPUT):
 *   - should_release: 'true' if a release should be created
 *   - skip_bump: 'true' if version bump should be skipped (current package version should be reused)
 *   - npm_published: 'true' if the current package version exists on npm
 *   - github_release_published: 'true' if the matching GitHub Release exists
 *
 * Addresses issues documented in:
 * - Issue #36: Release job silently skips when PRs merge without changesets
 */

import { appendFileSync } from 'fs';
import { execSync } from 'child_process';

import { getJsRoot, parseJsRootConfig } from './js-paths.mjs';
import { readPackageInfo } from './package-info.mjs';

const jsRootConfig = parseJsRootConfig();
const jsRoot = getJsRoot({ jsRoot: jsRootConfig, verbose: true });

/**
 * Write output to GitHub Actions output file
 * @param {string} name - Output name
 * @param {string} value - Output value
 */
function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    appendFileSync(outputFile, `${name}=${value}\n`);
  }
  console.log(`Output: ${name}=${value}`);
}

/**
 * Get the package name and version from package.json
 * @returns {{ name: string, version: string }}
 */
function getPackageInfo() {
  return readPackageInfo({ jsRoot });
}

/**
 * Check if a specific version is published on npm
 * @param {string} packageName
 * @param {string} version
 * @returns {boolean}
 */
function checkVersionOnNpm(packageName, version) {
  try {
    const result = execSync(`npm view "${packageName}@${version}" version`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim().includes(version);
  } catch {
    return false;
  }
}

function checkGithubRelease(repository, tagPrefix, version) {
  if (!repository) {
    console.log(
      'GITHUB_REPOSITORY not set, assuming GitHub release is missing'
    );
    return false;
  }

  const tag = `${tagPrefix}${version}`;

  try {
    execSync(`gh release view "${tag}" --repo "${repository}" --json tagName`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const hasChangesets = process.env.HAS_CHANGESETS === 'true';
  const repository =
    process.env.GITHUB_REPOSITORY || process.env.REPOSITORY || '';
  const tagPrefix = process.env.TAG_PREFIX || 'v';
  const { name: packageName, version: currentVersion } = getPackageInfo();

  console.log(`Package: ${packageName}`);
  console.log(`Current version: ${currentVersion}`);
  console.log(`Has changesets: ${hasChangesets}`);
  console.log(`GitHub release tag: ${tagPrefix}${currentVersion}`);

  if (hasChangesets) {
    console.log('Found changesets, proceeding with release');
    setOutput('should_release', 'true');
    setOutput('skip_bump', 'false');
    return;
  }

  console.log(
    `Checking if ${packageName}@${currentVersion} is published on npm...`
  );
  const isPublished = checkVersionOnNpm(packageName, currentVersion);
  console.log(`Published on npm: ${isPublished}`);
  setOutput('npm_published', isPublished ? 'true' : 'false');

  console.log(
    `Checking if GitHub release ${tagPrefix}${currentVersion} exists...`
  );
  const githubReleasePublished = checkGithubRelease(
    repository,
    tagPrefix,
    currentVersion
  );
  console.log(`Published as GitHub release: ${githubReleasePublished}`);
  setOutput(
    'github_release_published',
    githubReleasePublished ? 'true' : 'false'
  );

  if (isPublished && githubReleasePublished) {
    console.log(
      `No changesets and v${currentVersion} is fully published - no release needed`
    );
    setOutput('should_release', 'false');
    setOutput('skip_bump', 'false');
  } else {
    console.log(
      `No changesets but v${currentVersion} is missing at least one release artifact - release needed (self-healing)`
    );
    setOutput('should_release', 'true');
    setOutput('skip_bump', 'true');
  }
}

main();
