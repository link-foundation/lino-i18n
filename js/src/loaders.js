// Node file loaders. Text parsing and formatting are shared with browsers.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseLinoCatalog, parseLinoCatalogs } from './catalogs.js';
import { expandCompatibilityAliases } from './compatibility.js';

export {
  parseLinoCatalog,
  parseLinoCatalogs,
  formatLinoCatalog,
  formatLinoCatalogs,
  loadLocaleFromString,
} from './catalogs.js';

export async function loadLocaleFromFile(filePath, options = {}) {
  const text = await fs.readFile(filePath, 'utf8');
  const parsed = parseLinoCatalog(text, options);
  const locale =
    parsed.locale || path.basename(filePath, path.extname(filePath));
  return { locale, translations: parsed.translations };
}

export async function loadLocalesFromFile(filePath, options = {}) {
  const text = await fs.readFile(filePath, 'utf8');
  const parsed = parseLinoCatalogs(text, options);
  if (parsed.length > 0) {
    return parsed;
  }
  return [
    {
      locale: path.basename(filePath, path.extname(filePath)),
      translations: {},
    },
  ];
}

export async function loadLocalesFromDirectory(directory, options = {}) {
  const entries = (await fs.readdir(directory, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name)
  );
  const catalogues = {};
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    if (!entry.name.endsWith('.lino')) {
      continue;
    }
    const filePath = path.join(directory, entry.name);
    for (const { locale, translations } of await loadLocalesFromFile(
      filePath
    )) {
      if (!locale) {
        continue;
      }
      catalogues[locale] = {
        ...(catalogues[locale] || {}),
        ...translations,
      };
    }
  }
  for (const [locale, translations] of Object.entries(catalogues)) {
    catalogues[locale] = expandCompatibilityAliases(translations, options);
  }
  return catalogues;
}
