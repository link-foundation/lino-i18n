import test from 'node:test';
import assert from 'node:assert/strict';
import { createTranslator } from '../src/messages.js';

import * as adapter from '../src/node.js';

test('Node translation contexts isolate overlapping requests and expose scoped functions', async () => {
  const context = adapter.createTranslationContext();
  const options = { locales: { en: { Hi: 'Hi' }, fr: { Hi: 'Salut' } } };
  let release;
  const barrier = new Promise((resolve) => {
    release = resolve;
  });
  let started = 0;
  const results = await Promise.all(
    ['en', 'fr'].map((locale) =>
      context.withRequest(
        new Request(`https://example.org/${locale}`),
        options,
        async () => {
          started += 1;
          if (started === 2) {
            release();
          }
          await barrier;
          await Promise.resolve();
          return {
            locale: context.getLocale(),
            message: context.getGT()('Hi'),
          };
        }
      )
    )
  );
  assert.deepEqual(results, [
    { locale: 'en', message: 'Hi' },
    { locale: 'fr', message: 'Salut' },
  ]);
  assert.throws(() => context.getLocale(), /translation context/);
});

test('nested and failing scopes restore the outer instance and leave no ambient locale', async () => {
  const context = adapter.createTranslationContext();
  const outer = createTranslator({ defaultLocale: 'en' });
  const inner = createTranslator({ defaultLocale: 'fr' });
  await context.run(outer, async () => {
    assert.equal(context.getTranslator(), outer);
    await assert.rejects(
      context.run(inner, async () => {
        assert.equal(context.getLocale(), 'fr');
        throw new Error('request failed');
      }),
      /request failed/
    );
    assert.equal(context.getTranslator(), outer);
  });
  assert.throws(() => context.getTranslator(), /translation context/);
});

test('opt-in Node ambient helpers use the active translator for deferred and dictionary calls', async () => {
  const i18n = createTranslator({
    defaultLocale: 'fr',
    locales: {
      en: { 'actions.save': 'Save' },
      fr: { 'actions.save': 'Enregistrer' },
    },
  });
  await adapter.runWithTranslator(i18n, async () => {
    assert.equal(adapter.gt('Hi {name}', { name: 'Ada' }), 'Hi Ada');
    assert.equal(adapter.getTranslations('actions')('save'), 'Enregistrer');
    assert.deepEqual(adapter.getTranslations('actions').obj(), {
      save: 'Enregistrer',
    });
    assert.equal(await adapter.tx('Hi'), 'Hi');
    assert.deepEqual(adapter.getLocales(), ['en', 'fr']);
    assert.equal(adapter.getDefaultLocale(), 'fr');
  });
  assert.throws(() => adapter.getGT(), /translation context/);
});
