import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createI18n,
  parseLinoCatalog,
  formatLinoCatalog,
  interpolate,
  pluralSuffix,
  loadLocalesFromDirectory,
} from '../src/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(here, '..', 'locales');

test('interpolate replaces {{var}} and {var}', () => {
  assert.equal(
    interpolate('Hello, {{name}}!', { name: 'World' }),
    'Hello, World!'
  );
  assert.equal(
    interpolate('You have {count} items', { count: 3 }),
    'You have 3 items'
  );
  assert.equal(
    interpolate('Hi {{name}}', {}),
    'Hi {{name}}'
  );
});

test('pluralSuffix follows CLDR rules', () => {
  assert.equal(pluralSuffix('en', 1), 'one');
  assert.equal(pluralSuffix('en', 2), 'other');
  assert.equal(pluralSuffix('ru', 1), 'one');
  assert.equal(pluralSuffix('ru', 2), 'few');
  assert.equal(pluralSuffix('ru', 7), 'many');
});

test('parseLinoCatalog round-trips with formatLinoCatalog', () => {
  const original = {
    greeting: 'Hello, {{name}}!',
    'cart.title': 'Your cart',
    'cart.items_one': '{{count}} item',
    'cart.items_other': '{{count}} items',
    'navigation:home': 'Home',
  };
  const text = formatLinoCatalog('en', original);
  const parsed = parseLinoCatalog(text);
  assert.equal(parsed.locale, 'en');
  assert.deepEqual(parsed.translations, original);
});

test('createI18n resolves missing keys via fallback', () => {
  const i18n = createI18n({
    locales: {
      en: { hi: 'Hello' },
      ru: { bye: 'Пока' },
    },
    defaultLocale: 'ru',
    fallback: ['en'],
  });
  assert.equal(i18n.t('hi'), 'Hello'); // via fallback to en
  assert.equal(i18n.t('bye'), 'Пока');
  assert.equal(i18n.t('unknown', { defaultValue: 'Default' }), 'Default');
});

test('createI18n applies CLDR plurals per locale', async () => {
  const catalogues = await loadLocalesFromDirectory(localesDir);
  const i18n = createI18n({
    locales: catalogues,
    defaultLocale: 'en',
    fallback: ['en'],
  });
  assert.equal(i18n.t('cart.items', { count: 0 }), 'Your cart is empty');
  assert.equal(i18n.t('cart.items', { count: 1 }), '1 item');
  assert.equal(i18n.t('cart.items', { count: 5 }), '5 items');

  i18n.setLocale('ru');
  assert.equal(i18n.t('cart.items', { count: 1 }), '1 товар');
  assert.equal(i18n.t('cart.items', { count: 3 }), '3 товара');
  assert.equal(i18n.t('cart.items', { count: 7 }), '7 товаров');
});

test('createI18n falls back to onMissingKey when set', () => {
  const seen = [];
  const i18n = createI18n({
    locales: { en: { hi: 'Hello' } },
    defaultLocale: 'en',
    onMissingKey: ({ key }) => {
      seen.push(key);
      return `??${key}??`;
    },
  });
  assert.equal(i18n.t('unknown'), '??unknown??');
  assert.deepEqual(seen, ['unknown']);
});

test('createI18n exposes context (gender) suffixes', () => {
  const i18n = createI18n({
    locales: {
      en: {
        role_male: 'He is a developer',
        role_female: 'She is a developer',
        role_other: 'They are a developer',
      },
    },
    defaultLocale: 'en',
  });
  assert.equal(i18n.t('role', { context: 'male' }), 'He is a developer');
  assert.equal(i18n.t('role', { context: 'female' }), 'She is a developer');
  assert.equal(i18n.t('role', { context: 'unknown' }), 'They are a developer');
});

test('createI18n exposes namespace-prefixed keys', () => {
  const i18n = createI18n({
    locales: { en: { 'nav:home': 'Home', 'nav:profile': 'Profile' } },
    defaultLocale: 'en',
  });
  assert.equal(i18n.t('nav:home'), 'Home');
  assert.equal(i18n.t('nav:profile'), 'Profile');
});
