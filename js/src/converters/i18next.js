// Convert i18next resource bundles to flat lino catalogues.
//
// Input shapes accepted:
//   1. A single locale: { greeting: 'Hello', cart: { items: '...' } }
//   2. Multi-locale: { en: {...}, ru: {...} }
//   3. Multi-locale with namespaces: { en: { common: {...}, cart: {...} } }
//
// Notes:
//   - Nested keys are flattened with `.` (i18next default).
//   - When a namespace is present, keys are prefixed with `ns:`.
//   - i18next-style `_one` / `_other` suffixes are preserved verbatim.

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function flatten(prefix, value, out) {
  if (typeof value === 'string') {
    out[prefix] = value;
    return;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    out[prefix] = String(value);
    return;
  }
  if (Array.isArray(value)) {
    out[prefix] = value.join('\n');
    return;
  }
  if (!isPlainObject(value)) {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    flatten(nextKey, child, out);
  }
}

function looksLikeLocale(name) {
  return /^[a-z]{2,3}([-_][A-Za-z0-9]{2,8})*$/i.test(name);
}

function looksMultiLocale(input) {
  if (!isPlainObject(input)) {
    return false;
  }
  const keys = Object.keys(input);
  if (keys.length === 0) {
    return false;
  }
  return keys.every((key) => looksLikeLocale(key) && isPlainObject(input[key]));
}

function hasNamespaceShape(localeObj) {
  if (!isPlainObject(localeObj)) {
    return false;
  }
  const values = Object.values(localeObj);
  if (values.length === 0) {
    return false;
  }
  return values.every((value) => isPlainObject(value));
}

function flattenWithOptionalNamespaces(localeObj) {
  const out = {};
  if (!isPlainObject(localeObj)) {
    return out;
  }
  const useNamespaces = hasNamespaceShape(localeObj);
  if (useNamespaces) {
    for (const [ns, content] of Object.entries(localeObj)) {
      const nsOut = {};
      flatten('', content, nsOut);
      for (const [key, value] of Object.entries(nsOut)) {
        out[`${ns}:${key}`] = value;
      }
    }
  } else {
    flatten('', localeObj, out);
  }
  return out;
}

export function fromI18next(input, { locale, defaultLocale = 'en' } = {}) {
  if (!input) {
    return {};
  }
  if (looksMultiLocale(input)) {
    const result = {};
    for (const [lc, content] of Object.entries(input)) {
      result[lc] = flattenWithOptionalNamespaces(content);
    }
    return result;
  }
  const chosenLocale = locale || defaultLocale;
  return { [chosenLocale]: flattenWithOptionalNamespaces(input) };
}
