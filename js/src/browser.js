// Browser entry point: its entire import graph uses only platform APIs.
import { parseLinoCatalogs } from './catalogs.js';
import { expandCompatibilityAliases } from './compatibility.js';

export { createI18n } from './i18n.js';
export {
  parseLinoCatalog,
  parseLinoCatalogs,
  formatLinoCatalog,
  formatLinoCatalogs,
  loadLocaleFromString,
} from './catalogs.js';
export { expandCompatibilityAliases } from './compatibility.js';
export { detectLanguage, resolveLanguage } from './language.js';
export * from './intl.js';

// Fetch concurrently, then merge in input order. Generate aliases only after
// merging so a later explicit key always wins over an earlier generated alias.
export async function loadCatalogs(urls, options = {}) {
  const { fetch: fetchCatalog = globalThis.fetch, requestInit } = options;
  if (typeof fetchCatalog !== 'function') {
    throw new Error('loadCatalogs requires fetch');
  }
  const loaded = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetchCatalog(url, requestInit);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return parseLinoCatalogs(await response.text());
      } catch (cause) {
        throw new Error(
          `Failed to load catalog ${url}: ${cause?.message ?? String(cause)}`,
          {
            cause,
          }
        );
      }
    })
  );

  const catalogues = new Map();
  for (const entries of loaded) {
    for (const { locale, translations } of entries) {
      catalogues.set(locale, {
        ...catalogues.get(locale),
        ...translations,
      });
    }
  }
  return Object.fromEntries(
    Array.from(catalogues, ([locale, translations]) => [
      locale,
      expandCompatibilityAliases(translations, options),
    ])
  );
}
