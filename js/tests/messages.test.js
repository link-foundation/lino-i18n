import test from 'node:test';
import assert from 'node:assert/strict';
import { createTranslator, msg } from '../src/messages.js';

test('source messages, deferred descriptors, ICU and per-call locale share one API', () => {
  const i18n = createTranslator({
    locales: {
      fr: {
        greeting: 'Bonjour {name}',
        'Hello {v0}': 'Salut {v0}',
        photos:
          '{count, plural, =0 {Aucune photo} one {# photo} other {# photos}}',
      },
    },
  });
  const greeting = msg('Hello {name}', { id: 'greeting' });
  assert.equal(i18n.gt(greeting, { name: 'Ada' }), 'Hello Ada');
  i18n.setLocale('fr');
  const { gt } = i18n;
  assert.equal(gt(greeting, { name: 'Ada' }), 'Bonjour Ada');
  assert.equal(gt`Hello ${'Ada'}`, 'Salut Ada');
  assert.equal(i18n.m(greeting, { name: 'Lin' }), 'Bonjour Lin');
  assert.equal(
    gt(msg('{count, plural, other {# photos}}', { id: 'photos' }), {
      count: 0,
    }),
    'Aucune photo'
  );
  assert.equal(gt(greeting, { name: 'Ada' }, { locale: 'en' }), 'Hello Ada');
  assert.equal(i18n.getLocale(), 'fr');
});

test('ICU supports nested select, ordinal, offset, quoting and format skeletons', () => {
  const { gt } = createTranslator();
  assert.equal(
    gt(
      '{gender, select, female {{n, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}} other {none}}',
      { gender: 'female', n: 22 }
    ),
    '22nd'
  );
  assert.equal(
    gt('{n, plural, offset:1 =0 {none} one {you and one} other {you and #}}', {
      n: 3,
    }),
    'you and 2'
  );
  assert.equal(
    gt("'{literal}' {price, number, ::currency/USD}", { price: 2 }),
    '{literal} $2.00'
  );
  assert.throws(() => gt('Hello {name}'), /name/);
});

test('lazy loading deduplicates requests, retries failures and prevents stale locale switches', async () => {
  const pending = new Map();
  let calls = 0;
  const i18n = createTranslator({
    loadCatalog: (locale) => {
      calls += 1;
      return new Promise((resolve, reject) =>
        pending.set(locale, { resolve, reject })
      );
    },
  });
  const first = i18n.switchLocale('fr');
  const duplicate = i18n.load('fr');
  const second = i18n.switchLocale('de');
  await Promise.resolve();
  pending.get('de').resolve({ hello: 'Hallo' });
  await second;
  pending.get('fr').resolve({ hello: 'Bonjour' });
  await Promise.all([first, duplicate]);
  assert.equal(calls, 2);
  assert.equal(i18n.getLocale(), 'de');
  const failure = i18n.load('es');
  await Promise.resolve();
  pending.get('es').reject(new Error('offline'));
  await assert.rejects(failure, /offline/);
  const retry = i18n.load('es');
  await Promise.resolve();
  pending.get('es').resolve({ hello: 'Hola' });
  await retry;
  assert.equal(calls, 4);
});

test('feature flags, snapshots and tracing are instance scoped', () => {
  const events = [];
  const i18n = createTranslator({
    locales: { fr: { Hi: 'Salut' } },
    defaultLocale: 'fr',
    onTrace: (event) => events.push(event),
  });
  assert.equal(i18n.gt('Hi'), 'Salut');
  i18n.setEnabled(false);
  assert.equal(i18n.gt('Hi'), 'Hi');
  i18n.setEnabled(true);
  const snapshot = JSON.parse(JSON.stringify(i18n.snapshot()));
  assert.equal(createTranslator(snapshot).gt('Hi'), 'Salut');
  assert.equal(events[0].type, 'translation');
  assert.equal(createTranslator().getEnabled(), true);
});

test('tagged literal text and array declarations preserve source identity', () => {
  const { gt } = createTranslator();
  assert.equal(
    gt`Use {braces}, <tags> and don't change ${'Ada'}`,
    "Use {braces}, <tags> and don't change Ada"
  );
  assert.deepEqual(
    msg(['Save', 'Cancel'], { id: 'actions' }).map((entry) => entry.id),
    ['actions.0', 'actions.1']
  );
});

test('versioned caches, snapshots and region formatting survive catalog updates', async () => {
  const stored = new Map();
  let calls = 0;
  const cache = {
    get: (key) => stored.get(key),
    set: (key, table) => stored.set(key, table),
  };
  const options = {
    version: 'v1',
    cache,
    loadCatalog: async () => {
      calls += 1;
      return 'fr\n  Hi "Salut"';
    },
  };
  const first = createTranslator(options);
  await first.switchLocale('fr');
  const second = createTranslator(options);
  await second.switchLocale('fr');
  assert.equal(calls, 1);
  assert.equal(second.gt('Hi'), 'Salut');
  const third = createTranslator({ ...options, version: 'v2' });
  await third.load('fr');
  assert.equal(calls, 2);
  second.setRegion('CA');
  assert.equal(second.getFormatLocale(), 'fr-CA');
  second.addLocale('fr', { Hi: 'Bonjour' });
  assert.equal(
    createTranslator(JSON.parse(JSON.stringify(second.snapshot()))).gt('Hi'),
    'Bonjour'
  );
  assert.throws(() => second.setRegion('invalid'), /region/);
});
