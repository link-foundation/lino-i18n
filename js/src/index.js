// Public API of the `lino-i18n` package.
//
// All translations are stored in Links Notation (.lino) files and parsed
// by the dependency-free catalogue reader in `catalogs.js`. The runtime exposed here is intentionally
// small: it supports the features users expect from i18next / i18n-js /
// react-intl (interpolation, plurals, namespaces, fallbacks, defaults,
// missing-key callbacks) without locking us to a specific bundler or
// framework.

export { createI18n } from './node-i18n.js';
export { expandCompatibilityAliases } from './compatibility.js';
export {
  parseLinoCatalog,
  parseLinoCatalogs,
  formatLinoCatalog,
  formatLinoCatalogs,
  loadLocaleFromString,
  loadLocaleFromFile,
  loadLocalesFromFile,
  loadLocalesFromDirectory,
} from './loaders.js';
export {
  interpolate,
  resolveKey,
  pluralSuffix,
  applyContext,
} from './format.js';
export { fromI18next, fromI18nJs, fromReactIntl } from './converters/index.js';
export {
  createTranslator,
  msg,
  derive,
  declareStatic,
  formatMessage,
} from './messages.js';
export * from './intl.js';
