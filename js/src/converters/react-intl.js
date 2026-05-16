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

function decompileAst(ast) {
  if (typeof ast === 'string') return ast;
  if (!Array.isArray(ast)) return null;
  let out = '';
  for (const node of ast) {
    if (typeof node === 'string') {
      out += node;
      continue;
    }
    if (!node || typeof node !== 'object') continue;
    // FormatJS node shapes: { type: 0, value: 'text' } (literal)
    // { type: 1, value: 'name' } (argument), etc.
    if (node.type === 0 && typeof node.value === 'string') {
      out += node.value;
    } else if (node.type === 1 && typeof node.value === 'string') {
      out += `{${node.value}}`;
    } else if (typeof node.value === 'string') {
      out += `{${node.value}}`;
    } else {
      return null; // cannot represent reliably
    }
  }
  return out;
}

function normaliseMessage(entry) {
  if (typeof entry === 'string') return entry;
  if (Array.isArray(entry)) return decompileAst(entry);
  if (entry && typeof entry === 'object') {
    if (typeof entry.defaultMessage === 'string') return entry.defaultMessage;
    if (typeof entry.message === 'string') return entry.message;
    if (typeof entry.value === 'string') return entry.value;
  }
  return null;
}

function isLocaleMap(input) {
  if (!input || typeof input !== 'object') return false;
  const keys = Object.keys(input);
  if (keys.length === 0) return false;
  return keys.every((key) => /^[a-z]{2,3}([-_][A-Za-z0-9]{2,8})*$/i.test(key));
}

export function fromReactIntl(input, { locale, defaultLocale = 'en' } = {}) {
  if (!input || typeof input !== 'object') return {};
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
    if (typeof value === 'string') out[id] = value;
  }
  return out;
}
