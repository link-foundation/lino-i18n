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

// Yield files in traversal order; merge once so aliases never mask explicit keys.
async function* localeFiles(directory, recursive) {
  const entries = (await fs.readdir(directory, { withFileTypes: true })).sort(
    (left, right) => {
      if (!recursive) {
        return left.name.localeCompare(right.name);
      }
      return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
    }
  );
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (recursive && entry.isDirectory()) {
      yield* localeFiles(entryPath, recursive);
    } else if (entry.isFile() && entry.name.endsWith('.lino')) {
      yield entryPath;
    }
  }
}

export async function loadLocalesFromDirectory(directory, options = {}) {
  const catalogues = {};
  for await (const filePath of localeFiles(directory, options.recursive)) {
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
