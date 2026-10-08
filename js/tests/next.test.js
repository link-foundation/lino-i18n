import test from 'node:test';
import assert from 'node:assert/strict';
import { createNextI18n } from '../src/next/server.js';
import { createNextLocaleProxy } from '../src/next/proxy.js';

const options = {
  defaultLocale: 'en',
  supportedLanguages: ['en', 'fr'],
  locales: { en: { Hi: 'Hi' }, fr: { Hi: 'Salut' } },
};

test('Next proxy negotiates and persists a locale while forwarding request headers', () => {
  const proxy = createNextLocaleProxy(options);
  const redirect = proxy(
    new Request('https://example.org/cart?q=1', {
      headers: { 'accept-language': 'fr' },
    })
  );
  assert.equal(redirect.status, 307);
  assert.equal(
    redirect.headers.get('location'),
    'https://example.org/fr/cart?q=1'
  );
  assert.equal(redirect.cookies.get('locale').value, 'fr');
  const response = proxy(
    new Request(redirect.headers.get('location'), {
      headers: { 'x-lino-locale': 'en' },
    })
  );
  assert.equal(
    response.headers.get('x-middleware-request-x-lino-locale'),
    'fr'
  );
  assert.equal(response.cookies.get('locale').value, 'fr');
});

test('Next static translators, paths and alternate metadata retain isolated locale catalogs', async () => {
  const next = createNextI18n(options);
  const [en, fr] = await Promise.all([
    next.getTranslator('en'),
    next.getTranslator('fr'),
  ]);
  assert.equal(en.gt('Hi'), 'Hi');
  assert.equal(fr.gt('Hi'), 'Salut');
  fr.setLocale('en');
  assert.equal(en.getLocale(), 'en');
  assert.equal((await next.getGT('fr'))('Hi'), 'Salut');
  assert.deepEqual(next.generateStaticParams(), [
    { locale: 'en' },
    { locale: 'fr' },
  ]);
  assert.deepEqual(
    next.getMetadata('/fr/cart?q=1', 'https://example.org', 'fr'),
    {
      alternates: {
        canonical: 'https://example.org/fr/cart?q=1',
        languages: {
          en: 'https://example.org/en/cart?q=1',
          fr: 'https://example.org/fr/cart?q=1',
          'x-default': 'https://example.org/en/cart?q=1',
        },
      },
    }
  );
  await assert.rejects(next.getTranslator('de'), /Unsupported locale/);
});

test('Next static helpers await loaders and preserve all configured navigation locales', async () => {
  const calls = [];
  const next = createNextI18n({
    defaultLocale: 'en',
    supportedLanguages: ['en', 'fr'],
    loadCatalog: async (locale, { version }) => {
      calls.push([locale, version]);
      return { Hello: locale === 'fr' ? 'Bonjour' : 'Hello' };
    },
    version: 'v2',
  });
  const i18n = await next.getTranslator('fr');
  assert.equal(i18n.gt('Hello'), 'Bonjour');
  assert.deepEqual(calls, [['fr', 'v2']]);
  assert.deepEqual(i18n.getLocaleConfig().locales, ['en', 'fr']);
  assert.deepEqual(i18n.snapshot().localeConfig.locales, ['en', 'fr']);
});

test('Next locale prefetch forwards the payload locale without changing the preference cookie', () => {
  const proxy = createNextLocaleProxy(options);
  for (const headers of [
    { 'next-router-prefetch': '1' },
    { purpose: 'prefetch' },
    { 'sec-purpose': 'prefetch;prerender' },
    // Next strips Flight headers before passing an RSC fetch to Proxy.
    { 'sec-fetch-dest': 'empty', 'sec-fetch-mode': 'cors' },
  ]) {
    const response = proxy(new Request('https://example.org/fr', { headers }));
    assert.equal(
      response.headers.get('x-middleware-request-x-lino-locale'),
      'fr'
    );
    assert.equal(response.cookies.get('locale'), undefined);
  }
});
