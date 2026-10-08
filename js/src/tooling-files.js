import { readdir, readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  extractMessages,
  validateCatalog,
  translateCatalog,
} from './tooling.js';
import { formatLinoCatalog, loadLocalesFromDirectory } from './loaders.js';

async function sourceFiles(input) {
  const info = await stat(input);
  if (info.isFile()) {
    return [input];
  }
  const files = [];
  for (const entry of (await readdir(input, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name)
  )) {
    if (['node_modules', '.git', 'dist', 'coverage'].includes(entry.name)) {
      continue;
    }
    const file = path.join(input, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await sourceFiles(file)));
    } else if (
      entry.isFile() &&
      /\.[cm]?[jt]sx?$/.test(entry.name) &&
      !entry.name.endsWith('.d.ts')
    ) {
      files.push(file);
    }
  }
  return files;
}

export async function extractFiles(input) {
  const messages = new Map();
  const diagnostics = [];
  for (const file of await sourceFiles(input)) {
    const result = extractMessages(await readFile(file, 'utf8'), {
      file:
        path.relative(input, file).replaceAll('\\', '/') || path.basename(file),
    });
    diagnostics.push(...result.diagnostics);
    for (const message of result.messages) {
      const existing = messages.get(message.id);
      if (existing && existing.source !== message.source) {
        diagnostics.push({
          file,
          line: message.line,
          message: `Conflicting source messages for id ${message.id}`,
        });
      } else {
        messages.set(message.id, existing || message);
      }
    }
  }
  return {
    version: 1,
    messages: [...messages.values()].sort((a, b) => a.id.localeCompare(b.id)),
    diagnostics,
  };
}

export async function commandExtract(flags, log, err) {
  if (!flags.in || !flags.out) {
    err(
      'extract requires --in <source file or directory> and --out <directory>'
    );
    return 1;
  }
  const manifest = await extractFiles(flags.in);
  if (manifest.diagnostics.length) {
    err(JSON.stringify(manifest.diagnostics, null, 2));
    return 2;
  }
  await mkdir(flags.out, { recursive: true });
  await writeFile(
    path.join(flags.out, 'messages.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  await writeFile(
    path.join(flags.out, `${flags.locale || 'en'}.lino`),
    `${formatLinoCatalog(flags.locale || 'en', Object.fromEntries(manifest.messages.map(({ id, source }) => [id, source])))}\n`
  );
  log(`Extracted ${manifest.messages.length} messages to ${flags.out}`);
  return 0;
}

export async function readManifest(file) {
  const manifest = JSON.parse(await readFile(file, 'utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.messages)) {
    throw new Error('Expected a version 1 extraction manifest');
  }
  return manifest.messages;
}

export async function checkManifest(file, catalogues, log, previousFile) {
  const messages = await readManifest(file);
  const previousMessages = previousFile
    ? await readManifest(previousFile)
    : undefined;
  let count = 0;
  for (const [locale, table] of Object.entries(catalogues)) {
    for (const issue of validateCatalog(messages, table, {
      previousMessages,
    })) {
      log(`${locale}: ${JSON.stringify(issue)}`);
      count += 1;
    }
  }
  if (!count) {
    log('All catalogues match the extraction manifest.');
  }
  return count ? 2 : 0;
}

export async function commandTranslateCatalog(flags, log, err) {
  if (
    !flags.manifest ||
    !flags.dir ||
    !flags.locale ||
    !flags.provider ||
    !flags.out
  ) {
    err(
      'translate-catalog requires --manifest, --dir, --locale, --provider and --out'
    );
    return 1;
  }
  const messages = await readManifest(flags.manifest);
  const catalogues = await loadLocalesFromDirectory(flags.dir);
  const { default: provider } = await import(
    pathToFileURL(path.resolve(flags.provider)).href
  );
  const result = await translateCatalog(
    messages,
    catalogues[flags.locale] || {},
    {
      locale: flags.locale,
      sourceLocale: flags['source-locale'] || 'en',
      provider,
    }
  );
  await writeFile(
    flags.out,
    `${formatLinoCatalog(flags.locale, result.translations)}\n`
  );
  log(
    `Wrote ${result.translated.length} translation candidates to ${flags.out}`
  );
  return 0;
}
