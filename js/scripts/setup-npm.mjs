#!/usr/bin/env node

import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { runStrict } from './run-command.mjs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

/**
 * Update npm for OIDC trusted publishing
 * npm trusted publishing requires npm >= 11.5.1
 * Keep working npm installations. Recover the missing-module runner-image
 * failure using a registry tarball whose integrity is verified before use.
 */

export const NPM_MIN_VERSION = '11.5.1';
export const NODE_MIN_VERSION = '22.14.0';
export const NPM_TARGET_MAJOR = 11;
// Newest npm 11 release; every current Node.js line still bundles npm 11.
export const NPM_RECOVERY_VERSION = '11.21.0';
export const NPM_REGISTRY_METADATA_URL = 'https://registry.npmjs.org/npm';

export function parseVersion(version) {
  const match = String(version)
    .trim()
    .match(
      /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?(?:\+[0-9A-Za-z-.]+)?$/
    );

  if (!match) {
    throw new Error(`Invalid semantic version: ${version}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || '',
  };
}

export function compareVersions(leftVersion, rightVersion) {
  const left = parseVersion(leftVersion);
  const right = parseVersion(rightVersion);
  const keys = ['major', 'minor', 'patch'];

  for (const key of keys) {
    if (left[key] !== right[key]) {
      return left[key] > right[key] ? 1 : -1;
    }
  }

  if (left.prerelease === right.prerelease) {
    return 0;
  }

  if (!left.prerelease) {
    return 1;
  }

  if (!right.prerelease) {
    return -1;
  }

  return left.prerelease > right.prerelease ? 1 : -1;
}

export function isVersionAtLeast(version, minimumVersion) {
  return compareVersions(version, minimumVersion) >= 0;
}

export function isSupportedNpmVersion(version) {
  return isVersionAtLeast(version, NPM_MIN_VERSION);
}

export function isSupportedNodeVersion(version) {
  return isVersionAtLeast(version, NODE_MIN_VERSION);
}

export function selectLatestSupportedNpmRelease(metadata) {
  const releases = Object.entries(metadata?.versions || {})
    .filter(([version, release]) => {
      const parsed = parseVersion(version);
      return (
        parsed.major === NPM_TARGET_MAJOR &&
        !parsed.prerelease &&
        isSupportedNpmVersion(version) &&
        release?.dist?.tarball
      );
    })
    .sort(([leftVersion], [rightVersion]) =>
      compareVersions(rightVersion, leftVersion)
    );

  if (releases.length === 0) {
    throw new Error(
      `No npm ${NPM_TARGET_MAJOR}.x release found at or above ${NPM_MIN_VERSION}`
    );
  }

  const [version, release] = releases[0];
  return { version, tarballUrl: release.dist.tarball };
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
export async function setupNpm() {
  if (!isSupportedNodeVersion(process.version)) {
    throw new Error(
      `Node >= ${NODE_MIN_VERSION} is required for trusted publishing`
    );
  }
  try {
    const current = (await runStrict('npm', ['--version'])).stdout.trim();
    if (isSupportedNpmVersion(current)) {
      console.log(`npm ${current} supports trusted publishing`);
      return;
    }
    await runStrict('npm', [
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
  const updated = (await runStrict('npm', ['--version'])).stdout.trim();
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
