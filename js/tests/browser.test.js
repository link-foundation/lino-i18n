import assert from 'node:assert/strict';
import test from 'node:test';

// Import the public subpath so this also checks the package export map.
const browser = () => import('lino-i18n/browser');

test('browser entry loads and merges all locale roots in URL order', async () => {
  const { loadCatalogs, createI18n } = await browser();
  const requests = [];
  const completed = [];
  let releaseFirst;
  const secondRead = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  const texts = {
    '/first.lino':
      'en\n  greeting "Hello, {{name}}!"\nru\n  greeting "Привет, {{name}}!"',
    '/second.lino':
      'en\n  greeting "Welcome, {{name}}!"\n  onlyEnglish "Fallback"\nen\n  extra "Extra"',
  };
  const requestInit = { cache: 'no-cache' };
  const locales = await loadCatalogs(Object.keys(texts), {
    requestInit,
    fetch: async (url, init) => {
      requests.push({ url, init });
      return {
        ok: true,
        text: async () => {
          // Complete the first request last to exercise deterministic merging.
          if (url === '/first.lino') {
            await secondRead;
          } else {
            releaseFirst();
          }
          completed.push(url);
          return texts[url];
        },
      };
    },
  });
  assert.deepEqual(
    requests,
    Object.keys(texts).map((url) => ({ url, init: requestInit }))
  );
  assert.deepEqual(completed, ['/second.lino', '/first.lino']);
  assert.deepEqual(locales.en, {
    greeting: 'Welcome, {{name}}!',
    onlyEnglish: 'Fallback',
    extra: 'Extra',
  });
  const i18n = createI18n({ locales, defaultLocale: 'ru', fallback: ['en'] });
  assert.equal(i18n.t('greeting', { name: 'Ada' }), 'Привет, Ada!');
  assert.equal(i18n.t('onlyEnglish'), 'Fallback');
  i18n.setLocale('en');
  assert.equal(i18n.t('greeting', { name: 'Ada' }), 'Welcome, Ada!');
  assert.equal(typeof i18n.subscribe, 'function');
  assert.equal(i18n.loadLocaleFile, undefined);
  assert.equal(i18n.loadDirectory, undefined);
});

test('browser loader applies compatibility aliases after merging', async () => {
  const { loadCatalogs } = await browser();
  const locales = await loadCatalogs(['/nested', '/explicit'], {
    compatibilityAliases: ['collapseTail'],
    fetch: async (url) => ({
      ok: true,
      text: async () =>
        url === '/nested'
          ? 'en\n  group\n    nested\n      key "Nested"'
          : 'en\n  group.nested_key "Explicit"',
    }),
  });
  assert.equal(locales.en['group.nested.key'], 'Nested');
  assert.equal(locales.en['group.nested_key'], 'Explicit');
});

test('browser loader handles empty input and reports the failed URL', async () => {
  const { loadCatalogs } = await browser();
  assert.deepEqual(await loadCatalogs([]), {});
  await assert.rejects(
    loadCatalogs(['/unavailable.lino'], { fetch: null }),
    /requires fetch/
  );
  await assert.rejects(
    loadCatalogs(['/missing.lino'], {
      fetch: async () => ({ ok: false, status: 404 }),
    }),
    /missing\.lino.*404/
  );
  await assert.rejects(
    loadCatalogs(['/broken.lino'], {
      fetch: async () => ({
        ok: true,
        text: async () => 'en\n  value "unterminated',
      }),
    }),
    /broken\.lino.*unterminated/
  );
  const offline = new Error('offline');
  await assert.rejects(
    loadCatalogs(['/offline.lino'], {
      fetch: async () => {
        throw offline;
      },
    }),
    (error) =>
      error.message.includes('/offline.lino') && error.cause === offline
  );
});

test('language resolution respects preferences, regional tags, and fallbacks', async () => {
  const { resolveLanguage } = await browser();
  const options = {
    supportedLanguages: ['en', 'ru', 'pt-BR', 'pt'],
    defaultLocale: 'en',
  };
  for (const [preference, candidates, expected] of [
    [' RU_ru ', ['en-US'], 'ru'],
    ['auto', ['de-DE', 'PT_br', 'ru'], 'pt-BR'],
    ['pt-PT', ['ru'], 'pt'],
    ['unsupported', ['ru-RU', 'en'], 'ru'],
    [null, 'RU', 'ru'],
    ['auto', [], 'en'],
  ]) {
    assert.equal(resolveLanguage(preference, candidates, options), expected);
  }
  assert.equal(
    resolveLanguage('auto', [], {
      supportedLanguages: ['ru'],
      defaultLocale: 'en',
    }),
    'ru'
  );
  assert.equal(
    resolveLanguage('auto', [], {
      supportedLanguages: [],
      defaultLocale: 'fr',
    }),
    'fr'
  );
});

test('detectLanguage uses navigator languages, then language, and works without navigator', async () => {
  const { detectLanguage } = await browser();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const options = { supportedLanguages: ['en', 'ru'], defaultLocale: 'en' };
  try {
    for (const [navigator, expected] of [
      [{ languages: ['de-DE', 'ru-RU'], language: 'en-US' }, 'ru'],
      [{ languages: [], language: 'ru-RU' }, 'ru'],
      [{ language: 'de-DE' }, 'en'],
      [undefined, 'en'],
    ]) {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: navigator,
      });
      assert.equal(detectLanguage('auto', options), expected);
      assert.equal(detectLanguage('ru', options), 'ru');
    }
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, 'navigator', descriptor);
    } else {
      delete globalThis.navigator;
    }
  }
});
