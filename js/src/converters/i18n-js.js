// Convert i18n-js translation files (Rails-style JSON) into flat lino
// catalogues. i18n-js uses `%{var}` interpolation; this converter rewrites
// `%{name}` into `{{name}}` for consistency with the lino-i18n runtime
// while preserving everything else verbatim.

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function rewriteInterpolation(template) {
  if (typeof template !== 'string') return template;
  return template.replace(/%\{\s*([\w.-]+)\s*\}/g, '{{$1}}');
}

function flatten(prefix, value, out) {
  if (typeof value === 'string') {
    out[prefix] = rewriteInterpolation(value);
    return;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    out[prefix] = String(value);
    return;
  }
  if (Array.isArray(value)) {
    out[prefix] = value.map(rewriteInterpolation).join('\n');
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    flatten(nextKey, child, out);
  }
}

function looksLikeLocale(name) {
  return /^[a-z]{2,3}([-_][A-Za-z0-9]{2,8})*$/i.test(name);
}

function looksMultiLocale(input) {
  if (!isPlainObject(input)) return false;
  const keys = Object.keys(input);
  if (keys.length === 0) return false;
  return keys.every(
    (key) => looksLikeLocale(key) && isPlainObject(input[key])
  );
}

export function fromI18nJs(input, { locale, defaultLocale = 'en' } = {}) {
  if (!input) return {};
  if (looksMultiLocale(input)) {
    const result = {};
    for (const [lc, content] of Object.entries(input)) {
      const flat = {};
      flatten('', content, flat);
      result[lc] = flat;
    }
    return result;
  }
  const flat = {};
  flatten('', input, flat);
  return { [locale || defaultLocale]: flat };
}
