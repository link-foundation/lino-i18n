import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  extractProject,
  validateCatalog,
  translateCatalog,
} from './tooling.js';
import { formatLinoCatalog, loadLocalesFromDirectory } from './loaders.js';
import { readProjectSources } from './source-project-files.js';

export async function extractFiles(input, options = {}) {
  if (options.syntax && !['js', 'vue', 'python'].includes(options.syntax)) {
    throw new Error('Extraction syntax must be js, vue or python');
  }
  if (options.syntax === 'python' || String(input).endsWith('.py')) {
    const { extractPythonProject } = await import('./python-extract.js');
    return extractPythonProject(
      await readProjectSources(input, { ...options, includePython: true }),
      options
    );
  }
  if (options.syntax === 'vue' || String(input).endsWith('.vue')) {
    const { extractVueProject, parseVueSource } =
      await import('./vue-extract.js');
    const { parseSource } = await import('./extract.js');
    const sources = await readProjectSources(input, {
      ...options,
      includeVue: true,
      parser: (code, file) =>
        file.endsWith('.vue')
          ? parseVueSource(code, { file })
          : parseSource(code, file),
    });
    return extractVueProject(sources, options);
  }
  return extractProject(await readProjectSources(input, options), options);
}

export async function commandExtract(flags, log, err) {
  if (!flags.in || !flags.out) {
    err(
      'extract requires --in <source file or directory> and --out <directory>'
    );
    return 1;
  }
  const manifest = await extractFiles(flags.in, {
    syntax: flags.syntax,
    maxFiles:
      flags['max-files'] === undefined ? undefined : Number(flags['max-files']),
    maxBytes:
      flags['max-bytes'] === undefined ? undefined : Number(flags['max-bytes']),
  });
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
