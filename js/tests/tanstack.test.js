import assert from 'node:assert/strict';
import { test } from 'test-anywhere';
import { createTanStackI18n } from '../src/tanstack-start/server.js';
import { extractProject } from '../src/tooling.js';

test('TanStack request middleware retains isolated ambient and explicit contexts', async () => {
  const adapter = createTanStackI18n({
    supportedLanguages: ['en', 'fr'],
    sourceLocale: 'en',
    locales: { fr: { Hello: 'Bonjour' } },
  });
  const server = adapter.middleware.options.server;
  const results = await Promise.all(
    ['en', 'fr', 'en', 'fr'].map((locale) =>
      server({
        request: new Request(`https://example.org/${locale}/`),
        async next({ context }) {
          await Promise.resolve();
          assert.equal(context.lino, adapter.getTranslator());
          return [
            adapter.getLocale(),
            adapter.getGT()('Hello'),
            adapter.getSnapshot().defaultLocale,
          ];
        },
      })
    )
  );
  assert.deepEqual(results, [
    ['en', 'Hello', 'en'],
    ['fr', 'Bonjour', 'fr'],
    ['en', 'Hello', 'en'],
    ['fr', 'Bonjour', 'fr'],
  ]);
  assert.throws(adapter.getLocale, /active translation context/);
});

test('TanStack failed requests restore outer scopes and source bootstrap skips downloads', async () => {
  const loads = [];
  const adapter = createTanStackI18n({
    sourceLocale: 'en',
    supportedLanguages: ['en', 'fr'],
    loadCatalog: (locale) => {
      loads.push(locale);
      return Promise.resolve({ Hello: 'Bonjour' });
    },
  });
  const server = adapter.middleware.options.server;
  await server({
    request: new Request('https://example.org/en'),
    async next() {
      assert.equal(adapter.getGT()('Hello'), 'Hello');
      await assert.rejects(
        server({
          request: new Request('https://example.org/fr'),
          next() {
            throw new Error('handler failed');
          },
        }),
        /handler failed/
      );
      assert.equal(adapter.getLocale(), 'en');
    },
  });
  assert.deepEqual(loads, ['fr']);
  assert.throws(adapter.getSnapshot, /active translation context/);
});

test('TanStack snapshot preloading keeps the active request locale and rejects unknown locales', async () => {
  const adapter = createTanStackI18n({
    sourceLocale: 'en',
    supportedLanguages: ['en', 'fr'],
    localeConfig: { locales: ['en', 'fr'] },
    locales: { fr: { Hello: 'Bonjour' } },
  });
  await adapter.middleware.options.server({
    request: new Request('https://example.org/en'),
    async next() {
      const snapshot = await adapter.loadSnapshot('fr');
      assert.equal(snapshot.defaultLocale, 'fr');
      assert.equal(adapter.getLocale(), 'en');
      assert.equal(adapter.getGT()('Hello'), 'Hello');
      await assert.rejects(adapter.loadSnapshot('de'), /Unsupported locale/);
    },
  });
  await assert.rejects(
    adapter.loadSnapshot('fr'),
    /active translation context/
  );
});

test('TanStack factory imports and client hooks use the shared extraction identities', () => {
  const result = extractProject({
    'i18n.js':
      "import {createTanStackI18n} from 'lino-i18n/tanstack-start/server'; export const translation = createTanStackI18n({});",
    'server.js':
      "import {translation} from './i18n.js'; const gt = translation.getGT(); gt('Server message');",
    'client.jsx':
      "import {T, Var, useGT} from 'lino-i18n/tanstack-start/client'; const gt = useGT(); gt('Client message'); <T>Hello <Var name='name'>{name}</Var></T>;",
  });
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.messages.map(({ source }) => source).sort(), [
    'Client message',
    'Hello {name}',
    'Server message',
  ]);
});
