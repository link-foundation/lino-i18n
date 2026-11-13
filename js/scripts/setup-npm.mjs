#!/usr/bin/env node

import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { runStrict } from './run-command.mjs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

/**
 * Update npm for OIDC trusted publishing
 * Install the current npm release for OIDC trusted publishing.
 * Keep working npm installations. Recover the missing-module runner-image
 * failure using a registry tarball whose integrity is verified before use.
 */

export const NPM_MIN_VERSION = '12.2.2';
// npm 12's supported engines, including the patch floors on older LTS lines.
export const NODE_VERSION_RANGE = '^22.22.2 || ^24.15.0 || >=26.0.0';
export const NPM_RECOVERY_VERSION = '12.2.2';
export const NPM_REGISTRY_METADATA_URL = 'https://registry.npmjs.org/npm';

export function isSupportedNpmVersion(version) {
  return semver.gte(version, NPM_MIN_VERSION);
}

export function isSupportedNodeVersion(version) {
  return semver.satisfies(version, NODE_VERSION_RANGE);
}

function validateRecoveryMetadata(metadata) {
  if (
    metadata.version !== NPM_RECOVERY_VERSION ||
    !metadata.dist?.integrity?.startsWith('sha512-') ||
    !metadata.dist.tarball.startsWith('https://registry.npmjs.org/npm/-/')
  ) {
    throw new Error('Invalid npm recovery metadata');
  }
}

export async function recoverNpm({
  fetchFn = fetch,
  npmDirectory = resolve(dirname(process.execPath), '../lib/node_modules/npm'),
  runner = runStrict,
} = {}) {
  const response = await fetchFn(
    `${NPM_REGISTRY_METADATA_URL}/${NPM_RECOVERY_VERSION}`,
    {
      signal: globalThis.AbortSignal.timeout(15000),
    }
  );
  if (!response.ok) {
    throw new Error(`npm recovery metadata returned HTTP ${response.status}`);
  }
  const metadata = await response.json();
  validateRecoveryMetadata(metadata);
  const archive = await fetchFn(metadata.dist.tarball, {
    signal: globalThis.AbortSignal.timeout(15000),
  });
  if (!archive.ok) {
    throw new Error(`npm recovery tarball returned HTTP ${archive.status}`);
  }
  const bytes = Buffer.from(await archive.arrayBuffer());
  const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
  if (integrity !== metadata.dist.integrity) {
    throw new Error('npm recovery tarball integrity mismatch');
  }
  const temporary = await mkdtemp(
    join(dirname(npmDirectory), '.npm-recovery-')
  );
  const backup = `${temporary}-backup`;
  try {
    await writeFile(join(temporary, 'npm.tgz'), bytes);
    await runner('tar', ['xzf', join(temporary, 'npm.tgz'), '-C', temporary]);
    const manifest = JSON.parse(
      await readFile(join(temporary, 'package/package.json'), 'utf8')
    );
    if (manifest.name !== 'npm' || manifest.version !== NPM_RECOVERY_VERSION) {
      throw new Error('Unexpected npm recovery package');
    }
    await rename(npmDirectory, backup);
    try {
      await rename(join(temporary, 'package'), npmDirectory);
      await runner(process.execPath, [
        join(npmDirectory, 'bin/npm-cli.js'),
        '--version',
      ]);
    } catch (error) {
      await rm(npmDirectory, { recursive: true, force: true });
      await rename(backup, npmDirectory);
      throw error;
    }
    await rm(backup, { recursive: true, force: true });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

/** Keep supported npm and retain recovery for the known missing-module image. */
export async function setupNpm({
  runner = runStrict,
  nodeVersion = process.version,
} = {}) {
  if (!isSupportedNodeVersion(nodeVersion)) {
    throw new Error(
      `Node ${NODE_VERSION_RANGE} is required for npm ${NPM_MIN_VERSION}`
    );
  }
  try {
    const current = (await runner('npm', ['--version'])).stdout.trim();
    if (isSupportedNpmVersion(current)) {
      console.log(`npm ${current} supports trusted publishing`);
      return;
    }
    await runner('npm', [
      'install',
      '-g',
      `npm@${NPM_RECOVERY_VERSION}`,
      '--ignore-scripts',
    ]);
  } catch (error) {
    if (
      !/MODULE_NOT_FOUND|Cannot find module/.test(error.message) ||
      process.platform === 'win32'
    ) {
      throw error;
    }
    console.log(
      'Recovering npm after the known missing-module runner-image failure.'
    );
    await recoverNpm();
  }
  const updated = (await runner('npm', ['--version'])).stdout.trim();
  if (!isSupportedNpmVersion(updated)) {
    throw new Error('npm update did not produce a supported version');
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  setupNpm().catch((error) => {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  });
}
