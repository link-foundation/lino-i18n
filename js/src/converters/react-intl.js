// Convert react-intl / FormatJS catalogues into flat lino catalogues.
//
// react-intl messages can be in two shapes:
//   1. Compiled AST:   { 'cart.title': [...] }
//   2. Plain ICU:      { 'cart.title': 'Hello, {name}' }
//      or extracted:   { 'cart.title': { defaultMessage: 'Hello, {name}' } }
//
// This converter:
//   - Always emits ICU `{var}` placeholders verbatim. The lino-i18n
//     interpolation engine accepts both `{var}` and `{{var}}`.
//   - Preserves IDs as keys.
//   - When given an object of `{ defaultMessage, description }`, it
//     takes `defaultMessage`.
//   - Compiled AST messages are decompiled back to ICU when possible.

import { printAST } from '@formatjs/icu-messageformat-parser/printer.js';

function decompileAst(ast) {
  try {
    // Historical bundles may contain bare strings alongside AST nodes.
    return printAST(
      ast.map((node) =>
        typeof node === 'string' ? { type: 0, value: node } : node
      )
    );
  } catch {
    return null;
  }
}

function normaliseMessage(entry) {
  if (typeof entry === 'string') {
    return entry;
  }
  if (Array.isArray(entry)) {
    return decompileAst(entry);
  }
  if (entry && typeof entry === 'object') {
    if (typeof entry.defaultMessage === 'string') {
      return entry.defaultMessage;
    }
    if (typeof entry.message === 'string') {
      return entry.message;
    }
    if (typeof entry.value === 'string') {
      return entry.value;
    }
  }
  return null;
}

function isLocaleMap(input) {
  if (!input || typeof input !== 'object') {
    return false;
  }
  const keys = Object.keys(input);
  if (keys.length === 0) {
    return false;
  }
  return keys.every((key) => /^[a-z]{2,3}([-_][A-Za-z0-9]{2,8})*$/i.test(key));
}

export function fromReactIntl(input, { locale, defaultLocale = 'en' } = {}) {
  if (!input || typeof input !== 'object') {
    return {};
  }
  if (isLocaleMap(input)) {
    const result = {};
    for (const [lc, content] of Object.entries(input)) {
      result[lc] = flatten(content);
    }
    return result;
  }
  return { [locale || defaultLocale]: flatten(input) };
}

function flatten(messages) {
  const out = {};
  for (const [id, entry] of Object.entries(messages || {})) {
    const value = normaliseMessage(entry);
    if (typeof value === 'string') {
      out[id] = value;
    }
  }
  return out;
}
