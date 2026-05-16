// Loaders translate `.lino` text or files into the flat translation
// tables consumed by the runtime. The on-disk format is indented Links
// Notation, parsed by `lino-objects-codec.parseIndented`.

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { formatIndented, parseIndented } from 'lino-objects-codec';

const ESCAPE_PAIRS = [
  ['\\n', '\n'],
  ['\\r', '\r'],
  ['\\t', '\t'],
  ['\\\\', '\\'],
];

function unescapeValue(value) {
  if (typeof value !== 'string') return value;
  let result = value;
  for (const [from, to] of ESCAPE_PAIRS) {
    result = result.split(from).join(to);
  }
  return result;
}

// Parse the contents of a `.lino` catalogue. Returns
// `{ locale, translations }` where `translations` is a flat key→string map.
export function parseLinoCatalog(text) {
  const parsed = parseIndented({ text });
  if (!parsed || typeof parsed !== 'object') {
    return { locale: null, translations: {} };
  }
  const translations = {};
  const obj = parsed.obj || {};
  for (const [key, value] of Object.entries(obj)) {
    translations[key] = typeof value === 'string' ? unescapeValue(value) : String(value);
  }
  return { locale: parsed.id || null, translations };
}

// Format a flat translation table as indented Links Notation. The `locale`
// becomes the identifier of the root link.
export function formatLinoCatalog(locale, translations) {
  if (!locale) throw new Error('formatLinoCatalog requires a locale name');
  const safe = {};
  for (const [key, value] of Object.entries(translations || {})) {
    safe[key] = typeof value === 'string' ? value : String(value);
  }
  return formatIndented({ id: String(locale), obj: safe });
}

export async function loadLocaleFromString(locale, text) {
  const parsed = parseLinoCatalog(text);
  return {
    locale: locale || parsed.locale,
    translations: parsed.translations,
  };
}

export async function loadLocaleFromFile(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  const parsed = parseLinoCatalog(text);
  const locale =
    parsed.locale || path.basename(filePath, path.extname(filePath));
  return { locale, translations: parsed.translations };
}

export async function loadLocalesFromDirectory(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const catalogues = {};
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.lino')) continue;
    const filePath = path.join(directory, entry.name);
    const { locale, translations } = await loadLocaleFromFile(filePath);
    if (!locale) continue;
    catalogues[locale] = translations;
  }
  return catalogues;
}
