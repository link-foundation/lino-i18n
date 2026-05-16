import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createI18n,
  parseLinoCatalog,
  parseLinoCatalogs,
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
  assert.equal(interpolate('Hi {{name}}', {}), 'Hi {{name}}');
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

test('parseLinoCatalog flattens nested groups and selector variants', () => {
  const text = [
    'en',
    '  greeting "Hello, {{name}}!"',
    '  path "C:\\\\new"',
    '  cart',
    '    title "Your cart"',
    '    items',
    '      zero "Your cart is empty"',
    '      one "{{count}} item"',
    '      other "{{count}} items"',
    '  role',
    '    male "He is a developer"',
    '    female "She is a developer"',
    '    other "They are a developer"',
    '  legal """',
    '    First line',
    '    Second line',
    '  """',
    '',
  ].join('\n');
  const parsed = parseLinoCatalog(text);
  assert.equal(parsed.locale, 'en');
  assert.deepEqual(parsed.translations, {
    greeting: 'Hello, {{name}}!',
    path: 'C:\\new',
    'cart.title': 'Your cart',
    'cart.items_zero': 'Your cart is empty',
    'cart.items_one': '{{count}} item',
    'cart.items_other': '{{count}} items',
    role_male: 'He is a developer',
    role_female: 'She is a developer',
    role_other: 'They are a developer',
    legal: 'First line\nSecond line',
  });
});

test('parseLinoCatalogs accepts bundled multi-locale files', () => {
  const parsed = parseLinoCatalogs(
    ['en', '  greeting "Hello"', 'ru', '  greeting "Привет"', ''].join('\n')
  );
  assert.deepEqual(parsed, [
    { locale: 'en', translations: { greeting: 'Hello' } },
    { locale: 'ru', translations: { greeting: 'Привет' } },
  ]);
});

test('formatLinoCatalog emits nested catalogue syntax by default', () => {
  const text = formatLinoCatalog('en', {
    greeting: 'Hello, {{name}}!',
    'cart.title': 'Your cart',
    'cart.items_zero': 'Your cart is empty',
    'cart.items_one': '{{count}} item',
    'cart.items_other': '{{count}} items',
    role_male: 'He is a developer',
    role_female: 'She is a developer',
    role_other: 'They are a developer',
    legal: 'First line\nSecond line',
  });
  assert.match(
    text,
    /cart\n {4}title "Your cart"\n {4}items\n {6}zero "Your cart is empty"/
  );
  assert.match(text, /role\n {4}male "He is a developer"/);
  assert.match(text, /legal """\n {4}First line\n {4}Second line\n {2}"""/);

  const parsed = parseLinoCatalog(text);
  assert.equal(parsed.translations.legal, 'First line\nSecond line');
  assert.equal(parsed.translations['cart.items_other'], '{{count}} items');
  assert.equal(parsed.translations.role_female, 'She is a developer');
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
  assert.equal(
    i18n.t('hero.description'),
    'Keep each language in its own block, nest related messages together,\nand still resolve the same runtime keys.'
  );

  i18n.setLocale('ru');
  assert.equal(i18n.t('cart.items', { count: 1 }), '1 товар');
  assert.equal(i18n.t('cart.items', { count: 3 }), '3 товара');
  assert.equal(i18n.t('cart.items', { count: 7 }), '7 товаров');
});

test('loadLocalesFromDirectory merges bundled and per-language files', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'lino-i18n-locales-'));
  await fs.writeFile(
    path.join(tmp, 'base.lino'),
    [
      'en',
      '  cart',
      '    items',
      '      one "{{count}} item"',
      '      other "{{count}} items"',
      'ru',
      '  cart',
      '    items',
      '      one "{{count}} товар"',
      '      few "{{count}} товара"',
      '      many "{{count}} товаров"',
      '      other "{{count}} товаров"',
      '',
    ].join('\n')
  );
  await fs.writeFile(
    path.join(tmp, 'en.lino'),
    ['en', '  greeting "Hello, {{name}}!"', ''].join('\n')
  );

  const catalogues = await loadLocalesFromDirectory(tmp);
  assert.equal(catalogues.en.greeting, 'Hello, {{name}}!');
  assert.equal(catalogues.en['cart.items_other'], '{{count}} items');
  assert.equal(catalogues.ru['cart.items_few'], '{{count}} товара');

  await fs.rm(tmp, { recursive: true, force: true });
});

test('createI18n.loadLocaleFile registers bundled locale files', async () => {
  const tmp = await fs.mkdtemp(
    path.join(os.tmpdir(), 'lino-i18n-bundle-file-')
  );
  const filePath = path.join(tmp, 'all.lino');
  await fs.writeFile(
    filePath,
    ['en', '  greeting "Hello"', 'ru', '  greeting "Привет"', ''].join('\n')
  );

  const i18n = createI18n({ defaultLocale: 'en', fallback: ['en'] });
  const first = await i18n.loadLocaleFile(filePath);
  assert.equal(first, 'en');
  assert.deepEqual(i18n.listLocales(), ['en', 'ru']);
  assert.equal(i18n.t('greeting', {}, { locale: 'ru' }), 'Привет');

  await fs.rm(tmp, { recursive: true, force: true });
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
