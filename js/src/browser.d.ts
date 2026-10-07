import type {
  CompatibilityAliasOptions,
  I18nCoreInstance,
  I18nOptions,
} from './index.js';

export type {
  CompatibilityAlias,
  CompatibilityAliasOptions,
  I18nCoreInstance,
  I18nOptions,
  TOptions,
  TParams,
} from './index.js';
export {
  expandCompatibilityAliases,
  parseLinoCatalog,
  parseLinoCatalogs,
  formatLinoCatalog,
  formatLinoCatalogs,
  loadLocaleFromString,
} from './index.js';

export declare function createI18n(options?: I18nOptions): I18nCoreInstance;

export interface LoadCatalogsOptions extends CompatibilityAliasOptions {
  /** Override the platform fetch, for example in tests. */
  fetch?: typeof globalThis.fetch;
  /** Options forwarded to every request, including AbortSignal and cache. */
  requestInit?: RequestInit;
}

/** Merge every locale root, with later URLs overriding earlier keys. */
export declare function loadCatalogs(
  urls: Array<string | URL>,
  options?: LoadCatalogsOptions
): Promise<Record<string, Record<string, string>>>;

export interface LanguageOptions {
  /** Available catalogue locales; defaults to ['en']. */
  supportedLanguages?: string[];
  /** Locale used when no preference matches; defaults to 'en'. */
  defaultLocale?: string;
}

/** Match an explicit preference, candidates, then the default or first locale. */
export declare function resolveLanguage(
  preference?: string | null,
  candidates?: string | string[],
  options?: LanguageOptions
): string;

/** Read navigator.languages, falling back to navigator.language when empty. */
export declare function detectLanguage(
  preference?: string | null,
  options?: LanguageOptions
): string;
