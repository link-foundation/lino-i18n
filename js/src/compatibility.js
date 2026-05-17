// Compatibility helpers for catalogue migrations. These helpers work on the
// flat key tables produced by the loader and only add aliases for keys that do
// not already exist.

const ALIAS_NAMES = new Map([
  ['collapseTail', 'collapseTail'],
  ['collapse-tail', 'collapseTail'],
  ['parentLabel', 'parentLabel'],
  ['parent-label', 'parentLabel'],
]);

function toAliasList(options = {}) {
  if (Array.isArray(options) || typeof options === 'string') {
    return Array.isArray(options) ? options : [options];
  }
  const requested = options.compatibilityAliases ?? options.mode ?? [];
  return Array.isArray(requested) ? requested : [requested];
}

export function normalizeCompatibilityAliases(options = {}) {
  const normalized = [];
  for (const alias of toAliasList(options)) {
    if (!alias) {
      continue;
    }
    const name = ALIAS_NAMES.get(String(alias));
    if (!name) {
      throw new TypeError(`unknown compatibility alias mode: ${alias}`);
    }
    if (!normalized.includes(name)) {
      normalized.push(name);
    }
  }
  return normalized;
}

function collapseTailAliases(key) {
  const parts = key.split('.');
  if (parts.length < 3) {
    return [];
  }
  const aliases = [];
  for (let index = 1; index < parts.length - 1; index += 1) {
    aliases.push(
      `${parts.slice(0, index).join('.')}.${parts.slice(index).join('_')}`
    );
  }
  return aliases;
}

function parentLabelAlias(key) {
  if (!key.endsWith('.label')) {
    return null;
  }
  const parent = key.slice(0, -'.label'.length);
  return parent || null;
}

export function expandCompatibilityAliases(translations, options = {}) {
  const aliases = normalizeCompatibilityAliases(options);
  const expanded = { ...(translations || {}) };
  if (aliases.length === 0) {
    return expanded;
  }

  const hasOwn = Object.prototype.hasOwnProperty;
  for (const [key, value] of Object.entries(translations || {})) {
    if (aliases.includes('collapseTail')) {
      for (const alias of collapseTailAliases(key)) {
        if (!hasOwn.call(expanded, alias)) {
          expanded[alias] = value;
        }
      }
    }

    if (aliases.includes('parentLabel')) {
      const alias = parentLabelAlias(key);
      if (alias && !hasOwn.call(expanded, alias)) {
        expanded[alias] = value;
      }
    }
  }

  return expanded;
}
