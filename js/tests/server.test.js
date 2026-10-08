import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRequestTranslator,
  getRequestLocale,
  localizePath,
  stripLocale,
  createLocaleMiddleware,
} from '../src/server.js';

test('explicit source requests skip downloads while keyed request loading remains compatible', async () => {
  const loads = [];
  const options = {
    supportedLanguages: ['en', 'fr'],
    loadCatalog: async (locale) => {
      loads.push(locale);
      return { greeting: 'loaded' };
    },
  };
  const request = new Request('https://example.org/en');
  const source = await createRequestTranslator(request, {
    ...options,
    sourceLocale: 'en',
  });
  assert.equal(source.gt('Hello'), 'Hello');
  assert.deepEqual(loads, []);
  const keyed = await createRequestTranslator(request, options);
  assert.equal(keyed.t('greeting'), 'loaded');
  assert.deepEqual(loads, ['en']);
});

test('server plural components use configured canonical locale rules', async () => {
  const { createTranslator } = await import('../src/messages.js');
  const { Plural } = await import('../src/react-server.js');
  const i18n = createTranslator({
    defaultLocale: 'company',
    localeConfig: { customMapping: { company: { code: 'ar' } } },
  });
  assert.equal(Plural({ i18n, count: 2, two: 'pair', other: 'many' }), 'pair');
  assert.equal(
    Plural({ i18n, locale: 'en', count: 2, two: 'pair', other: 'many' }),
    'many'
  );
});

test('request negotiation respects URL, cookie and weighted Accept-Language priorities', () => {
  const options = {
    supportedLanguages: ['en', 'fr', 'de'],
    defaultLocale: 'en',
  };
  const request = new Request('https://example.org/fr/account', {
    headers: {
      cookie: 'locale=de',
      'accept-language': 'en;q=0.2, fr;q=0.9, de;q=0',
    },
  });
  assert.equal(getRequestLocale(request, options), 'fr');
  assert.equal(
    getRequestLocale(
      new Request('https://example.org/account', {
        headers: { cookie: 'locale=de' },
      }),
      options
    ),
    'de'
  );
  assert.equal(
    getRequestLocale(
      new Request('https://example.org/account', {
        headers: { 'accept-language': 'en;q=0.2, fr;q=0.9' },
      }),
      options
    ),
    'fr'
  );
});

test('locale middleware redirects once and retains query strings', () => {
  const middleware = createLocaleMiddleware({
    supportedLanguages: ['en', 'fr'],
  });
  const response = middleware(
    new Request('https://example.org/cart?q=1', {
      headers: { 'accept-language': 'fr' },
    })
  );
  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get('location'),
    'https://example.org/fr/cart?q=1'
  );
  assert.equal(
    middleware(new Request(response.headers.get('location'))),
    undefined
  );
});

test('localized paths preserve query and hash and replace only supported locale prefixes', () => {
  assert.equal(
    localizePath('/fr/cart?q=1#total', 'de', ['en', 'fr', 'de']),
    '/de/cart?q=1#total'
  );
  assert.equal(
    stripLocale('/fr/cart?q=1#total', ['en', 'fr']),
    '/cart?q=1#total'
  );
  assert.equal(
    localizePath('/english/cart', 'fr', ['en', 'fr']),
    '/fr/english/cart'
  );
  assert.throws(
    () => localizePath('https://outside.org', 'fr', ['fr']),
    /relative/
  );
});

test('concurrent request translators and async server content do not share mutable locale', async () => {
  const options = {
    locales: { en: { Hi: 'Hi' }, fr: { Hi: 'Salut' } },
    supportedLanguages: ['en', 'fr'],
  };
  const [en, fr] = await Promise.all(
    ['en', 'fr'].map((locale) =>
      createRequestTranslator(
        new Request(`https://example.org/${locale}`),
        options
      )
    )
  );
  assert.equal(en.gt('Hi'), 'Hi');
  assert.equal(fr.gt('Hi'), 'Salut');
  fr.setLocale('en');
  assert.equal(en.getLocale(), 'en');
  const { Tx } = await import('../src/react-server.js');
  assert.equal(
    await Tx({ i18n: en, source: 'Hello {name}', values: { name: 'Ada' } }),
    'Hello Ada'
  );
});

test('request negotiation selects custom catalog identities from canonical headers and aliases', async () => {
  const options = {
    defaultLocale: 'english',
    locales: { english: { Hi: 'Hi' }, canadian: { Hi: 'Salut' } },
    localeConfig: {
      aliases: { francophone: 'canadian' },
      customMapping: {
        english: { code: 'en-US' },
        canadian: { code: 'fr-CA' },
      },
    },
  };
  const request = new Request('https://example.org/account', {
    headers: { 'accept-language': 'fr-CA, en-US;q=0.5' },
  });
  assert.equal(getRequestLocale(request, options), 'canadian');
  assert.equal(
    (await createRequestTranslator(request, options)).gt('Hi'),
    'Salut'
  );
  assert.equal(
    getRequestLocale(
      new Request('https://example.org/francophone/account'),
      options
    ),
    'canadian'
  );
});
