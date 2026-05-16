// Converters take an external translation source (i18next JSON, i18n-js
// JSON, react-intl JSON) and return a normalized `{ [locale]: { [key]: value } }`
// map ready to be serialised by `formatLinoCatalog`.

export { fromI18next } from './i18next.js';
export { fromI18nJs } from './i18n-js.js';
export { fromReactIntl } from './react-intl.js';
export { detectFormat } from './detect.js';

export const SUPPORTED_FORMATS = ['i18next', 'i18n-js', 'react-intl'];
