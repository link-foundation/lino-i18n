// Basic usage of lino-i18n: load a directory of .lino files and translate.
//
// Run with `node js/examples/basic-usage.mjs`.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createI18n, loadLocalesFromDirectory } from '../src/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(here, '..', 'locales');

const catalogues = await loadLocalesFromDirectory(localesDir);
const i18n = createI18n({
  locales: catalogues,
  defaultLocale: 'en',
  fallback: ['en'],
});

console.log(i18n.t('greeting', { name: 'Alice' }));
console.log(i18n.t('cart.items', { count: 0 }));
console.log(i18n.t('cart.items', { count: 1 }));
console.log(i18n.t('cart.items', { count: 5 }));

i18n.setLocale('ru');
console.log(i18n.t('greeting', { name: 'Алиса' }));
console.log(i18n.t('cart.items', { count: 1 }));
console.log(i18n.t('cart.items', { count: 3 }));
console.log(i18n.t('cart.items', { count: 7 }));

console.log(i18n.t('navigation:home'));
console.log(i18n.t('role', { context: 'female' }));
