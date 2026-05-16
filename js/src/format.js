// Pure helpers used by the i18n runtime: interpolation, plural-suffix
// resolution against `Intl.PluralRules`, context suffixing, and the key
// resolution algorithm shared between the runtime and the CLI.

const INTERPOLATION_PATTERN = /\{\{?\s*([\w.$:-]+)\s*\}?\}/g;

const PLURAL_SUFFIXES = ['zero', 'one', 'two', 'few', 'many', 'other'];

export function interpolate(template, params) {
  if (typeof template !== 'string') return template;
  if (!params) return template;
  return template.replace(INTERPOLATION_PATTERN, (match, name) => {
    if (!Object.prototype.hasOwnProperty.call(params, name)) {
      return match;
    }
    const value = params[name];
    return value === null || value === undefined ? '' : String(value);
  });
}

export function pluralSuffix(locale, count) {
  if (count === undefined || count === null) return null;
  const numeric = Number(count);
  if (!Number.isFinite(numeric)) return null;
  try {
    const rules = new Intl.PluralRules(locale);
    return rules.select(numeric);
  } catch {
    return numeric === 1 ? 'one' : 'other';
  }
}

export function applyContext(key, context) {
  if (!context) return key;
  return `${key}_${context}`;
}

function lookup(table, key) {
  if (!table) return undefined;
  if (Object.prototype.hasOwnProperty.call(table, key)) return table[key];
  return undefined;
}

// Resolve a key inside a flat translation table that may contain dotted
// keys (e.g., `cart.items`) or namespaced keys (`navigation:home`).
// Plural-aware: when `count` is present, the function looks up the
// best CLDR variant from the given locale and falls back to `_other`.
//
// Returns `undefined` when the key cannot be resolved. The caller is
// responsible for fallback handling.
export function resolveKey(table, key, { count, context, locale } = {}) {
  if (!table || typeof table !== 'object') return undefined;
  const withContext = context ? applyContext(key, context) : key;

  const targets = context ? [withContext, key] : [withContext];

  for (const target of targets) {
    if (count !== undefined && count !== null && Number.isFinite(Number(count))) {
      const numeric = Number(count);
      if (numeric === 0) {
        const zeroCandidate = lookup(table, `${target}_zero`);
        if (zeroCandidate !== undefined) return zeroCandidate;
      }
      const suffix = pluralSuffix(locale, numeric);
      if (suffix) {
        const candidate = lookup(table, `${target}_${suffix}`);
        if (candidate !== undefined) return candidate;
      }
      const otherCandidate = lookup(table, `${target}_other`);
      if (otherCandidate !== undefined) return otherCandidate;
    }

    const direct = lookup(table, target);
    if (direct !== undefined) return direct;
  }

  if (context) {
    const otherFallback = lookup(table, `${key}_other`);
    if (otherFallback !== undefined) return otherFallback;
  }

  return undefined;
}

export const _internals = { PLURAL_SUFFIXES, INTERPOLATION_PATTERN };
