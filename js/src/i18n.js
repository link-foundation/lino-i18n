// Runtime engine. Returns an i18n instance with `t`, `setLocale`,
// `getLocale`, `loadLocale`, `loadLocaleFile`, `loadDirectory`,
// `getFallbacks`, and `has`. The API is small on purpose: combine it with
// the framework integrations users already have (React, Vue, etc.).

import {
  loadLocaleFromString,
  loadLocalesFromFile,
  loadLocalesFromDirectory,
} from './loaders.js';
import { interpolate, resolveKey } from './format.js';

function normalizeFallbacks(fallback) {
  if (!fallback) {
    return [];
  }
  if (Array.isArray(fallback)) {
    return fallback.filter(Boolean).map(String);
  }
  return [String(fallback)];
}

export function createI18n(options = {}) {
  const {
    locales = {},
    defaultLocale = 'en',
    fallback = ['en'],
    onMissingKey,
    interpolation = { prefix: '{{', suffix: '}}' },
  } = options;

  const catalogues = new Map();
  for (const [locale, translations] of Object.entries(locales)) {
    catalogues.set(locale, { ...translations });
  }

  let currentLocale = defaultLocale;
  const fallbacks = normalizeFallbacks(fallback);

  function getLocale() {
    return currentLocale;
  }

  function setLocale(locale) {
    if (typeof locale !== 'string' || !locale) {
      throw new TypeError('setLocale expects a non-empty string locale');
    }
    currentLocale = locale;
  }

  function getFallbacks() {
    return [...fallbacks];
  }

  function listLocales() {
    return Array.from(catalogues.keys());
  }

  function has(key, locale = currentLocale) {
    const table = catalogues.get(locale);
    return resolveKey(table, key, { locale }) !== undefined;
  }

  function _lookup(key, opts) {
    const tried = [];
    const locales = [opts?.locale || currentLocale, ...fallbacks];
    for (const locale of locales) {
      if (tried.includes(locale)) {
        continue;
      }
      tried.push(locale);
      const table = catalogues.get(locale);
      if (!table) {
        continue;
      }
      const value = resolveKey(table, key, {
        count: opts?.count,
        context: opts?.context,
        locale,
      });
      if (value !== undefined) {
        return { value, locale };
      }
    }
    return null;
  }

  function t(key, params = {}, options = {}) {
    if (typeof key !== 'string') {
      return key;
    }
    const found = _lookup(key, {
      count: params.count,
      context: params.context ?? options.context,
      locale: options.locale,
    });
    if (!found) {
      if (typeof onMissingKey === 'function') {
        const fallbackValue = onMissingKey({ key, params, options });
        if (typeof fallbackValue === 'string') {
          return interpolate(fallbackValue, params);
        }
      }
      if (params && typeof params.defaultValue === 'string') {
        return interpolate(params.defaultValue, params);
      }
      if (typeof options.defaultValue === 'string') {
        return interpolate(options.defaultValue, params);
      }
      return key;
    }
    return interpolate(found.value, params);
  }

  function addLocale(locale, translations) {
    if (!locale || typeof locale !== 'string') {
      throw new TypeError('addLocale requires a string locale name');
    }
    const current = catalogues.get(locale) || {};
    catalogues.set(locale, { ...current, ...translations });
  }

  async function loadLocale(locale, text) {
    const parsed = await loadLocaleFromString(locale, text);
    if (!parsed.locale) {
      throw new Error('loadLocale could not determine the locale name');
    }
    addLocale(parsed.locale, parsed.translations);
    return parsed.locale;
  }

  async function loadLocaleFile(filePath) {
    const loaded = await loadLocalesFromFile(filePath);
    for (const { locale, translations } of loaded) {
      addLocale(locale, translations);
    }
    return loaded[0]?.locale;
  }

  async function loadDirectory(directory) {
    const loaded = await loadLocalesFromDirectory(directory);
    for (const [locale, translations] of Object.entries(loaded)) {
      addLocale(locale, translations);
    }
    return Object.keys(loaded);
  }

  return {
    t,
    has,
    getLocale,
    setLocale,
    getFallbacks,
    listLocales,
    addLocale,
    loadLocale,
    loadLocaleFile,
    loadDirectory,
    interpolation,
  };
}
