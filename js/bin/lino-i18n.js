#!/usr/bin/env node

// `lino-i18n` command-line entry point.
//
// Built on top of `lino-arguments` so configuration follows the same
// priority chain as the rest of the Link Foundation stack: CLI flags
// > environment variables > config file > defaults.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import { createI18n } from '../src/i18n.js';
import {
  formatLinoCatalog,
  formatLinoCatalogs,
  loadLocalesFromDirectory,
} from '../src/loaders.js';
import {
  detectFormat,
  fromI18next,
  fromI18nJs,
  fromReactIntl,
  SUPPORTED_FORMATS,
} from '../src/converters/index.js';

function usage() {
  return [
    'Usage: lino-i18n <command> [options]',
    '',
    'Commands:',
    '  convert    Convert i18next / i18n-js / react-intl JSON files to .lino',
    '  check      Compare locales against a reference locale and report missing keys',
    '  t          Translate a key from the CLI for quick debugging',
    '',
    'Run `lino-i18n <command> --help` for command-specific options.',
  ].join('\n');
}

function commandHelp(command) {
  if (command === 'convert') {
    return [
      'Usage: lino-i18n convert --in <path> --out <dir> [options]',
      '',
      'Options:',
      '  --in <path>        File or directory with source translations (required)',
      '  --out <dir>        Destination directory for .lino files (required)',
      `  --from <format>    Source format: ${SUPPORTED_FORMATS.join(', ')} (default: auto-detect)`,
      '  --locale <code>    Override locale name when the input is a single-locale file',
      '  --default <code>   Default locale when not detectable (default: en)',
      '  --single-file <f>  Write all converted locales to one bundled .lino file',
      '  --config <path>    Read command defaults from a JSON config file',
    ].join('\n');
  }
  if (command === 'check') {
    return [
      'Usage: lino-i18n check --dir <dir> [--reference <locale>]',
      '',
      'Options:',
      '  --dir <dir>            Directory containing .lino files',
      '  --reference <locale>   Reference locale to diff against (default: en)',
      '  --config <path>        Read command defaults from a JSON config file',
    ].join('\n');
  }
  if (command === 't') {
    return [
      'Usage: lino-i18n t --dir <dir> --locale <code> <key> [k=v ...]',
      '',
      'Options:',
      '  --dir <dir>      Directory containing .lino files',
      '  --locale <code>  Locale to use when translating',
      '  --fallback <c>   Fallback locale (default: en)',
      '  --config <path>  Read command defaults from a JSON config file',
    ].join('\n');
  }
  return usage();
}

function parseFlags(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      flags.help = true;
      continue;
    }
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
        continue;
      }
      const name = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[name] = next;
        i += 1;
      } else {
        flags[name] = true;
      }
      continue;
    }
    rest.push(arg);
  }
  return { flags, rest };
}

async function withConfig(command, flags) {
  if (!flags.config) {
    return flags;
  }
  const configPath =
    flags.config === true ? 'lino-i18n.config.json' : String(flags.config);
  const text = await fs.readFile(configPath, 'utf8');
  const parsed = JSON.parse(text);
  const commandConfig =
    parsed && typeof parsed === 'object' && parsed[command]
      ? parsed[command]
      : parsed;
  if (!commandConfig || typeof commandConfig !== 'object') {
    return flags;
  }
  return { ...commandConfig, ...flags };
}

function flagValue(flags, kebabName, camelName) {
  return flags[kebabName] ?? flags[camelName];
}

function pickConverter(format) {
  switch (format) {
    case 'i18next':
      return fromI18next;
    case 'i18n-js':
      return fromI18nJs;
    case 'react-intl':
      return fromReactIntl;
    default:
      return null;
  }
}

async function readJsonInput(inputPath) {
  const stat = await fs.stat(inputPath);
  if (stat.isFile()) {
    const text = await fs.readFile(inputPath, 'utf8');
    return [
      {
        filePath: inputPath,
        data: JSON.parse(text),
        baseName: path.basename(inputPath, path.extname(inputPath)),
      },
    ];
  }
  const entries = (await fs.readdir(inputPath, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name)
  );
  const out = [];
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    if (!entry.name.endsWith('.json')) {
      continue;
    }
    const filePath = path.join(inputPath, entry.name);
    const text = await fs.readFile(filePath, 'utf8');
    out.push({
      filePath,
      data: JSON.parse(text),
      baseName: path.basename(entry.name, '.json'),
    });
  }
  return out;
}

async function commandConvert(flags, log = console.log, err = console.error) {
  if (!flags.in || !flags.out) {
    err('lino-i18n convert: --in and --out are required');
    err(commandHelp('convert'));
    return 1;
  }
  await fs.mkdir(flags.out, { recursive: true });

  const requestedFormat = flags.from;
  if (requestedFormat && !SUPPORTED_FORMATS.includes(requestedFormat)) {
    err(`lino-i18n convert: unsupported --from value '${requestedFormat}'.`);
    err(`Supported formats: ${SUPPORTED_FORMATS.join(', ')}`);
    return 1;
  }

  const inputs = await readJsonInput(flags.in);
  if (inputs.length === 0) {
    err(`lino-i18n convert: no JSON inputs found at ${flags.in}`);
    return 1;
  }

  const aggregated = {};
  for (const { data, baseName } of inputs) {
    const format = requestedFormat || detectFormat(data);
    const convert = pickConverter(format);
    if (!convert) {
      err(`lino-i18n convert: no converter for format '${format}'`);
      return 1;
    }
    const result = convert(data, {
      locale: flags.locale || baseName,
      defaultLocale: flags.default || 'en',
    });
    for (const [locale, table] of Object.entries(result)) {
      aggregated[locale] = { ...(aggregated[locale] || {}), ...table };
    }
  }

  const singleFile = flagValue(flags, 'single-file', 'singleFile');
  if (singleFile) {
    const outputPath = path.isAbsolute(String(singleFile))
      ? String(singleFile)
      : path.join(flags.out, String(singleFile));
    const text = `${formatLinoCatalogs(aggregated)}\n`;
    await fs.writeFile(outputPath, text, 'utf8');
    log(`wrote ${outputPath} (${Object.keys(aggregated).length} locales)`);
    return 0;
  }

  for (const [locale, table] of Object.entries(aggregated)) {
    const text = `${formatLinoCatalog(locale, table)}\n`;
    const outputPath = path.join(flags.out, `${locale}.lino`);
    await fs.writeFile(outputPath, text, 'utf8');
    log(`wrote ${outputPath} (${Object.keys(table).length} keys)`);
  }
  return 0;
}

async function commandCheck(flags, log = console.log, err = console.error) {
  if (!flags.dir) {
    err('lino-i18n check: --dir is required');
    err(commandHelp('check'));
    return 1;
  }
  const reference = flags.reference || 'en';
  const catalogues = await loadLocalesFromDirectory(flags.dir);
  if (!catalogues[reference]) {
    err(
      `lino-i18n check: reference locale '${reference}' not found in ${flags.dir}`
    );
    return 1;
  }
  const referenceKeys = new Set(Object.keys(catalogues[reference]));
  let issues = 0;
  for (const [locale, table] of Object.entries(catalogues)) {
    if (locale === reference) {
      continue;
    }
    const missing = [];
    const unknown = [];
    for (const key of referenceKeys) {
      if (!Object.prototype.hasOwnProperty.call(table, key)) {
        missing.push(key);
      }
    }
    for (const key of Object.keys(table)) {
      if (!referenceKeys.has(key)) {
        unknown.push(key);
      }
    }
    if (missing.length === 0 && unknown.length === 0) {
      continue;
    }
    issues += missing.length + unknown.length;
    log(`# ${locale}`);
    for (const key of missing) {
      log(`  missing: ${key}`);
    }
    for (const key of unknown) {
      log(`  unknown: ${key}`);
    }
  }
  if (issues === 0) {
    log('All catalogues are aligned with the reference locale.');
    return 0;
  }
  return 2;
}

async function commandTranslate(
  flags,
  rest,
  log = console.log,
  err = console.error
) {
  if (!flags.dir || !flags.locale || rest.length === 0) {
    err('lino-i18n t: --dir, --locale, and a key are required');
    err(commandHelp('t'));
    return 1;
  }
  const [key, ...params] = rest;
  const catalogues = await loadLocalesFromDirectory(flags.dir);
  const i18n = createI18n({
    locales: catalogues,
    defaultLocale: flags.locale,
    fallback: flags.fallback ? [flags.fallback] : ['en'],
  });
  const values = {};
  for (const entry of params) {
    const eq = entry.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const name = entry.slice(0, eq);
    const value = entry.slice(eq + 1);
    values[name] = /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
  }
  const translated = i18n.t(key, values);
  log(translated);
  return 0;
}

export async function runCli(argv, io = {}) {
  const log = io.log || console.log;
  const err = io.err || console.error;
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    log(usage());
    return 0;
  }
  if (argv[0] === '--version' || argv[0] === '-v') {
    const pkg = JSON.parse(
      await fs.readFile(new URL('../package.json', import.meta.url), 'utf8')
    );
    log(pkg.version);
    return 0;
  }
  const [command, ...rest] = argv;
  const { flags, rest: positional } = parseFlags(rest);
  if (flags.help) {
    log(commandHelp(command));
    return 0;
  }
  const configuredFlags = await withConfig(command, flags);
  switch (command) {
    case 'convert':
      return commandConvert(configuredFlags, log, err);
    case 'check':
      return commandCheck(configuredFlags, log, err);
    case 't':
    case 'translate':
      return commandTranslate(configuredFlags, positional, log, err);
    default:
      err(`Unknown command: ${command}`);
      err(usage());
      return 1;
  }
}

function isCliEntryPoint() {
  if (!process.argv[1]) {
    return false;
  }
  try {
    return process.argv[1] === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isCliEntryPoint()) {
  runCli(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(error?.stack || error?.message || error);
      process.exitCode = 1;
    }
  );
}
