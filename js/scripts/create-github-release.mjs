#!/usr/bin/env bun

/**
 * Create GitHub Release from CHANGELOG.md
 * Usage: node scripts/create-github-release.mjs --release-version <version> --repository <repository> [--tag-prefix <prefix>] [--language <language>] [--workflow-file <file>] [--package-name <name>]
 *   release-version: Version number (e.g., 1.0.0)
 *   repository: GitHub repository (e.g., owner/repo)
 *   tag-prefix: Prefix for the git tag (default: "v", use "js-v" for multi-language repos)
 *   language: Human-readable language name for the release title (default: "JavaScript")
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE =
  'Usage: node scripts/create-github-release.mjs --release-version <version> --repository <repository> [--tag-prefix <prefix>] [--language <language>] [--workflow-file <file>] [--package-name <name>]';

const ARG_OPTION_KEYS = new Map([
  ['--release-version', 'releaseVersion'],
  ['--repository', 'repository'],
  ['--tag-prefix', 'tagPrefix'],
  ['--language', 'language'],
  ['--workflow-file', 'workflowFile'],
  ['--package-name', 'packageName'],
]);

export function parseArgs(argv, env = process.env) {
  const config = {
    language: env.LANGUAGE ?? 'JavaScript',
    packageName: env.PACKAGE_NAME ?? '',
    releaseVersion: env.VERSION ?? '',
    repository: env.REPOSITORY ?? '',
    tagPrefix: env.TAG_PREFIX ?? 'v',
    workflowFile: env.WORKFLOW_FILE ?? 'js.yml',
  };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const equalsIndex = arg.indexOf('=');
    const optionName = equalsIndex === -1 ? arg : arg.slice(0, equalsIndex);
    const configKey = ARG_OPTION_KEYS.get(optionName);

    if (!configKey) {
      continue;
    }

    if (equalsIndex === -1) {
      config[configKey] = readOptionValue(argv, index, optionName);
      index++;
    } else {
      config[configKey] = arg.slice(equalsIndex + 1);
    }
  }

  return config;
}

function readOptionValue(argv, index, optionName) {
  const value = argv[index + 1];

  if (value === undefined || value.startsWith('--')) {
    throw new Error(`Missing value for ${optionName}`);
  }

  return value;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractReleaseNotes(changelog, version) {
  // Read from CHANGELOG.md between this version header and the next version header.
  const versionHeaderRegex = new RegExp(
    `## ${escapeRegex(version)}[\\s\\S]*?(?=## \\d|$)`
  );
  const match = changelog.match(versionHeaderRegex);

  if (!match) {
    return `Release ${version}`;
  }

  const releaseNotes = match[0].replace(`## ${version}`, '').trim();

  return releaseNotes || `Release ${version}`;
}

export function normalizeReleaseVersionForTitle(releaseVersion) {
  const trimmedVersion = releaseVersion.trim();
  const semverTagMatch = trimmedVersion.match(
    /(?:^|[-_])v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/i
  );

  if (semverTagMatch) {
    return semverTagMatch[1];
  }

  return trimmedVersion
    .replace(/^[A-Za-z][A-Za-z0-9]*[-_]/, '')
    .replace(/^v/i, '');
}

export function buildReleaseTitle(language, releaseVersion) {
  const titleLanguage = language.trim() || 'JavaScript';
  return `[${titleLanguage}] ${normalizeReleaseVersionForTitle(releaseVersion)}`;
}

export function buildNpmBadge(packageName, version) {
  const normalizedVersion = normalizeReleaseVersionForTitle(version);
  const encodedPackageName = encodeURIComponent(packageName);

  return `[![npm](https://img.shields.io/npm/v/${encodedPackageName}?label=npm)](https://www.npmjs.com/package/${packageName}/v/${normalizedVersion})`;
}

export function buildWorkflowBadge(repository, workflowFile, label) {
  return `[![${label}](https://github.com/${repository}/actions/workflows/${workflowFile}/badge.svg?branch=main)](https://github.com/${repository}/actions/workflows/${workflowFile})`;
}

export function buildReleaseBadges({
  language = 'JavaScript',
  packageName = '',
  repository = '',
  version = '',
  workflowFile = 'js.yml',
}) {
  const badges = [];
  const trimmedPackageName = packageName.trim();
  const trimmedRepository = repository.trim();
  const trimmedWorkflowFile = workflowFile.trim();

  if (trimmedPackageName) {
    badges.push(buildNpmBadge(trimmedPackageName, version));
  }

  if (trimmedRepository && trimmedWorkflowFile) {
    badges.push(
      buildWorkflowBadge(
        trimmedRepository,
        trimmedWorkflowFile,
        `${language.trim() || 'JavaScript'} CI/CD`
      )
    );
  }

  return badges.join(' ');
}

function prependBadges(notes, badges) {
  return badges ? `${badges}\n\n${notes}` : notes;
}

export function buildReleasePayload({
  changelog,
  language,
  packageName,
  repository,
  tag,
  version,
  workflowFile,
}) {
  const releaseNotes = extractReleaseNotes(changelog, version);
  const badges = buildReleaseBadges({
    language,
    packageName,
    repository,
    version,
    workflowFile,
  });

  return JSON.stringify({
    tag_name: tag,
    name: buildReleaseTitle(language ?? 'JavaScript', tag),
    body: prependBadges(releaseNotes, badges),
  });
}

function formatGhOutput(result) {
  return [result.stderr, result.stdout]
    .filter((output) => typeof output === 'string' && output.trim())
    .map((output) => output.trim())
    .join('\n');
}

function getGhExitDescription(result) {
  if (result.signal) {
    return `signal ${result.signal}`;
  }

  if (typeof result.status === 'number') {
    return `code ${result.status}`;
  }

  return 'unknown exit status';
}

export function createRelease({ payload, repository, spawn = spawnSync }) {
  const result = spawn(
    'gh',
    ['api', `repos/${repository}/releases`, '-X', 'POST', '--input', '-'],
    {
      encoding: 'utf8',
      input: payload,
    }
  );

  if (result.error) {
    throw new Error(`gh api failed to start: ${result.error.message}`);
  }

  if (result.status === 0) {
    return { alreadyExists: false };
  }

  const output = formatGhOutput(result);

  if (/already_exists/i.test(output)) {
    return { alreadyExists: true };
  }

  const details = output ? `:\n${output}` : '';
  throw new Error(
    `gh api failed with ${getGhExitDescription(result)}${details}`
  );
}

function readPackageName(cwd) {
  try {
    const packageInfo = JSON.parse(
      readFileSync(path.join(cwd, 'package.json'), 'utf8')
    );
    return typeof packageInfo.name === 'string' ? packageInfo.name : '';
  } catch {
    return '';
  }
}

export function main({
  argv = process.argv.slice(2),
  cwd = process.cwd(),
  env = process.env,
  spawn = spawnSync,
  stderr = console.error,
  stdout = console.log,
} = {}) {
  try {
    const {
      language,
      packageName,
      releaseVersion: version,
      repository,
      tagPrefix,
      workflowFile,
    } = parseArgs(argv, env);

    if (!version || !repository) {
      stderr('Error: Missing required arguments');
      stderr(USAGE);
      return 1;
    }

    const tag = `${tagPrefix}${version}`;

    stdout(`Creating GitHub release for ${tag}...`);

    const changelog = readFileSync(path.join(cwd, 'CHANGELOG.md'), 'utf8');
    const payload = buildReleasePayload({
      changelog,
      language,
      packageName: packageName || readPackageName(cwd),
      repository,
      tag,
      version,
      workflowFile,
    });
    const result = createRelease({ payload, repository, spawn });

    if (result.alreadyExists) {
      stdout(`GitHub release already exists: ${tag}. Skipping creation.`);
      return 0;
    }

    stdout(`\u2705 Created GitHub release: ${tag}`);
    return 0;
  } catch (error) {
    stderr(`Error creating release: ${error.message}`);
    return 1;
  }
}

function isCliEntryPoint() {
  return (
    typeof process !== 'undefined' &&
    process.argv?.[1] &&
    fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  );
}

if (isCliEntryPoint()) {
  process.exitCode = main();
}
