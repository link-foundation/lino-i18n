// Loaders translate `.lino` text or files into the flat translation
// tables consumed by the runtime. The authoring format is an i18n-focused
// subset of indented Links Notation: each top-level block is a locale, nested
// blocks become dotted keys, and plural/context selector blocks become
// underscore suffixes such as `cart.items_one` and `role_female`.

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { expandCompatibilityAliases } from './compatibility.js';

const SELECTOR_SUFFIXES = new Set([
  'zero',
  'one',
  'two',
  'few',
  'many',
  'other',
  'male',
  'female',
  'neutral',
]);

const LABEL_ALIAS_KEY = 'label';

function unescapeValue(value, quote = '"') {
  let result = '';
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char !== '\\') {
      result += char;
      continue;
    }
    index += 1;
    const next = value[index];
    if (next === undefined || next === '\\') {
      result += '\\';
    } else if (next === 'n') {
      result += '\n';
    } else if (next === 'r') {
      result += '\r';
    } else if (next === 't') {
      result += '\t';
    } else if (next === quote) {
      result += quote;
    } else {
      result += `\\${next}`;
    }
  }
  return result;
}

function escapeValue(value) {
  return value
    .split('\\')
    .join('\\\\')
    .split('"')
    .join('\\"')
    .split('\r')
    .join('\\r')
    .split('\t')
    .join('\\t');
}

function countIndent(line) {
  let count = 0;
  for (const char of line) {
    if (char === ' ') {
      count += 1;
    } else if (char === '\t') {
      count += 2;
    } else {
      break;
    }
  }
  return count;
}

function stripContentIndent(line, indent) {
  let remaining = indent;
  let index = 0;
  while (index < line.length && remaining > 0) {
    const char = line[index];
    if (char === ' ') {
      remaining -= 1;
      index += 1;
    } else if (char === '\t') {
      remaining -= 2;
      index += 1;
    } else {
      break;
    }
  }
  return line.slice(index);
}

function findClosingQuote(value, quote, start = 1) {
  let escaped = false;
  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === quote) {
      return index;
    }
  }
  return -1;
}

function parseTripleQuotedValue(lines, index, rest, indent) {
  const sameLine = rest.slice(3);
  if (sameLine.trim()) {
    const closing = sameLine.lastIndexOf('"""');
    if (closing !== -1) {
      return {
        value: sameLine.slice(0, closing),
        nextIndex: index + 1,
      };
    }
  }

  const valueLines = [];
  const contentIndent = indent + 2;
  for (let current = index + 1; current < lines.length; current += 1) {
    const raw = lines[current].replace(/\r$/, '');
    if (raw.trim() === '"""') {
      return {
        value: valueLines.join('\n'),
        nextIndex: current + 1,
      };
    }
    valueLines.push(stripContentIndent(raw, contentIndent));
  }
  throw new Error('unterminated multiline string');
}

function parseQuotedValue(lines, index, rest, indent) {
  if (rest.startsWith('"""')) {
    return parseTripleQuotedValue(lines, index, rest, indent);
  }

  const quote = rest[0];
  const closing = findClosingQuote(rest, quote);
  if (closing !== -1) {
    return {
      value: unescapeValue(rest.slice(1, closing), quote),
      nextIndex: index + 1,
    };
  }

  const chunks = [rest.slice(1)];
  for (let current = index + 1; current < lines.length; current += 1) {
    const raw = lines[current].replace(/\r$/, '');
    const lineClosing = findClosingQuote(raw, quote, 0);
    if (lineClosing !== -1) {
      chunks.push(raw.slice(0, lineClosing));
      return {
        value: unescapeValue(chunks.join('\n'), quote),
        nextIndex: current + 1,
      };
    }
    chunks.push(raw);
  }
  throw new Error('unterminated quoted string');
}

function parseLogicalLines(text) {
  const lines = String(text || '')
    .replace(/\r\n/g, '\n')
    .split('\n');
  const entries = [];
  for (let index = 0; index < lines.length; ) {
    const raw = lines[index].replace(/\r$/, '');
    const content = raw.trimEnd();
    if (!content.trim() || content.trimStart().startsWith('#')) {
      index += 1;
      continue;
    }

    const indent = countIndent(content);
    const trimmed = content.trimStart();
    const match = /^(\S+)(?:\s+(.*))?$/.exec(trimmed);
    if (!match) {
      index += 1;
      continue;
    }

    let key = match[1];
    const rest = match[2]?.trimStart();
    if (rest === undefined && key.endsWith(':')) {
      key = key.slice(0, -1);
    }

    if (rest === undefined) {
      entries.push({ indent, key, value: null });
      index += 1;
      continue;
    }

    if (rest.startsWith('"') || rest.startsWith("'")) {
      const parsed = parseQuotedValue(lines, index, rest, indent);
      entries.push({ indent, key, value: parsed.value });
      index = parsed.nextIndex;
      continue;
    }

    entries.push({ indent, key, value: unescapeValue(rest.trim()) });
    index += 1;
  }
  return entries;
}

function parseEntriesAt(lines, start, indent) {
  const tree = {};
  let index = start;

  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) {
      break;
    }
    if (line.indent > indent) {
      throw new Error(`unexpected indentation before ${line.key}`);
    }

    index += 1;
    if (line.value !== null) {
      tree[line.key] = line.value;
      continue;
    }

    if (index < lines.length && lines[index].indent > line.indent) {
      const parsed = parseEntriesAt(lines, index, lines[index].indent);
      tree[line.key] = parsed.tree;
      index = parsed.index;
    } else {
      tree[line.key] = {};
    }
  }

  return { tree, index };
}

function parseLocaleTrees(text) {
  const lines = parseLogicalLines(text);
  const catalogues = [];
  let index = 0;

  while (index < lines.length) {
    const root = lines[index];
    if (root.indent !== 0) {
      throw new Error(`expected a locale root before ${root.key}`);
    }
    if (root.value !== null) {
      throw new Error(`locale root ${root.key} cannot have a direct value`);
    }

    index += 1;
    let tree = {};
    if (index < lines.length && lines[index].indent > root.indent) {
      const parsed = parseEntriesAt(lines, index, lines[index].indent);
      tree = parsed.tree;
      index = parsed.index;
    }
    catalogues.push({ locale: root.key, tree });
  }

  return catalogues;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSelectorGroup(value) {
  const entries = Object.entries(value).filter(
    ([key]) => key !== LABEL_ALIAS_KEY
  );
  return (
    entries.length > 0 &&
    entries.every(
      ([key, child]) => SELECTOR_SUFFIXES.has(key) && typeof child === 'string'
    )
  );
}

function labelAliasValue(value) {
  return typeof value[LABEL_ALIAS_KEY] === 'string'
    ? value[LABEL_ALIAS_KEY]
    : undefined;
}

function addLabelAlias(out, base, value) {
  if (!Object.prototype.hasOwnProperty.call(out, base)) {
    out[base] = value;
  }
}

function flattenTree(tree, pathParts = [], out = {}) {
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'string') {
      out[[...pathParts, key].join('.')] = value;
      continue;
    }
    if (!isPlainObject(value)) {
      continue;
    }

    const nextPath = [...pathParts, key];
    const base = nextPath.join('.');
    const labelValue = labelAliasValue(value);
    if (isSelectorGroup(value)) {
      if (labelValue !== undefined) {
        out[`${base}.${LABEL_ALIAS_KEY}`] = labelValue;
        addLabelAlias(out, base, labelValue);
      }
      for (const [suffix, child] of Object.entries(value)) {
        if (suffix === LABEL_ALIAS_KEY) {
          continue;
        }
        out[`${base}_${suffix}`] = child;
      }
      continue;
    }
    flattenTree(value, nextPath, out);
    if (labelValue !== undefined) {
      addLabelAlias(out, base, labelValue);
    }
  }
  return out;
}

function splitSelectorSuffix(key) {
  const index = key.lastIndexOf('_');
  if (index <= 0) {
    return null;
  }
  const suffix = key.slice(index + 1);
  if (!SELECTOR_SUFFIXES.has(suffix)) {
    return null;
  }
  return { base: key.slice(0, index), suffix };
}

function setNestedValue(tree, parts, value) {
  let node = tree;
  for (const part of parts.slice(0, -1)) {
    const current = node[part];
    if (!isPlainObject(current)) {
      node[part] = {};
      if (typeof current === 'string') {
        node[part][LABEL_ALIAS_KEY] = current;
      }
    }
    node = node[part];
  }
  const leaf = parts[parts.length - 1];
  if (isPlainObject(node[leaf])) {
    if (!Object.prototype.hasOwnProperty.call(node[leaf], LABEL_ALIAS_KEY)) {
      node[leaf][LABEL_ALIAS_KEY] = value;
    }
    return;
  }
  node[leaf] = value;
}

function translationsToTree(translations) {
  const tree = {};
  for (const [rawKey, rawValue] of Object.entries(translations || {})) {
    const key = String(rawKey);
    const value = typeof rawValue === 'string' ? rawValue : String(rawValue);
    const selector = splitSelectorSuffix(key);
    if (selector) {
      setNestedValue(
        tree,
        [...selector.base.split('.'), selector.suffix],
        value
      );
    } else {
      setNestedValue(tree, key.split('.'), value);
    }
  }
  return tree;
}

function formatValue(value, indent) {
  if (value.includes('\n')) {
    const contentIndent = `${indent}  `;
    const lines = value.split('\n').map((line) => `${contentIndent}${line}`);
    return `"""\n${lines.join('\n')}\n${indent}"""`;
  }
  return `"${escapeValue(value)}"`;
}

function formatTreeLines(tree, indent = '  ') {
  const lines = [];
  const entries = Object.entries(tree);
  const labelEntry = entries.find(([key]) => key === LABEL_ALIAS_KEY);
  const orderedEntries = labelEntry
    ? [labelEntry, ...entries.filter(([key]) => key !== LABEL_ALIAS_KEY)]
    : entries;
  for (const [key, value] of orderedEntries) {
    if (typeof value === 'string') {
      lines.push(`${indent}${key} ${formatValue(value, indent)}`);
      continue;
    }
    if (!isPlainObject(value)) {
      continue;
    }
    lines.push(`${indent}${key}`);
    lines.push(...formatTreeLines(value, `${indent}  `));
  }
  return lines;
}

function formatFlatCatalog(locale, translations) {
  const lines = [String(locale)];
  for (const [key, value] of Object.entries(translations || {})) {
    const safe = typeof value === 'string' ? value : String(value);
    lines.push(`  ${key} ${formatValue(safe, '  ')}`);
  }
  return lines.join('\n');
}

// Parse the contents of one `.lino` catalogue. Returns the first
// `{ locale, translations }` pair when the file contains multiple locale
// roots. Use `parseLinoCatalogs` to keep every root.
export function parseLinoCatalog(text, options = {}) {
  const catalogues = parseLinoCatalogs(text, options);
  return catalogues[0] || { locale: null, translations: {} };
}

// Parse every top-level locale block in a `.lino` string.
export function parseLinoCatalogs(text, options = {}) {
  return parseLocaleTrees(text).map(({ locale, tree }) => ({
    locale: locale || null,
    translations: expandCompatibilityAliases(flattenTree(tree), options),
  }));
}

// Format a flat translation table as indented Links Notation. The default
// output is nested for readability; pass `{ style: 'flat' }` to emit one
// key/value line per translation.
export function formatLinoCatalog(locale, translations, options = {}) {
  if (!locale) {
    throw new Error('formatLinoCatalog requires a locale name');
  }
  if (options.style === 'flat') {
    return formatFlatCatalog(locale, translations);
  }
  const lines = [String(locale)];
  lines.push(...formatTreeLines(translationsToTree(translations)));
  return lines.join('\n');
}

export function formatLinoCatalogs(catalogues, options = {}) {
  const entries = Array.isArray(catalogues)
    ? catalogues.map(({ locale, translations }) => [locale, translations])
    : Object.entries(catalogues || {}).sort(([left], [right]) =>
        left.localeCompare(right)
      );
  return entries
    .map(([locale, translations]) =>
      formatLinoCatalog(locale, translations, options)
    )
    .join('\n\n');
}

export async function loadLocaleFromString(locale, text, options = {}) {
  const parsedCatalogues = parseLinoCatalogs(text, options);
  const parsed = parsedCatalogues.find(
    (catalogue) => catalogue.locale === locale
  ) ||
    parsedCatalogues[0] || { locale: null, translations: {} };
  return {
    locale: locale || parsed.locale,
    translations: parsed.translations,
  };
}

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
