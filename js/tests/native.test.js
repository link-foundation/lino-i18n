import assert from 'node:assert/strict';
import { test } from 'test-anywhere';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Text, View } from 'react-native-web';
import { createNativeI18n, Var, useGT } from '../src/react-native.js';
import { extractMessages, extractProject } from '../src/tooling.js';

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test('Native T translates actual native Text children and preserves code-owned props', () => {
  const native = createNativeI18n({
    Text,
    locales: { fr: { 'Hello <c0>{name}</c0>!': 'Bonjour <c0>{name}</c0> !' } },
    defaultLocale: 'fr',
  });
  const output = renderToStaticMarkup(
    h(
      native.Provider,
      null,
      h(
        native.T,
        null,
        'Hello ',
        h(
          Text,
          { style: { fontWeight: 'bold' }, testID: 'name' },
          h(Var, { name: 'name', value: 'Ada' })
        ),
        '!'
      )
    )
  );
  assert.match(output, /Bonjour/);
  assert.match(output, /font-weight:bold/);
  assert.match(output, /data-testid="name"/);
  assert.match(output, /Ada/);
});

test('Native imported Text extraction has the same structural source identity', () => {
  const result = extractMessages(
    `import { Text as NativeText } from 'react-native';\nimport { createNativeI18n, Var } from 'lino-i18n/react-native';\nconst { T } = createNativeI18n({ Text: NativeText });\n<T>Hello <NativeText><Var name="name">{name}</Var></NativeText>!</T>;`
  );
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.messages[0].source, 'Hello <c0>{name}</c0>!');
});

test('Native Text and factory re-exports preserve structural identities across modules', () => {
  const result = extractProject({
    'ui.js':
      "export { Text as Label } from 'react-native-web'; export { createNativeI18n } from 'lino-i18n/react-native';",
    'App.jsx':
      "import {Label, createNativeI18n} from './ui.js'; const native = createNativeI18n({Text:Label}); <native.T>Hello <Label>Ada</Label>!</native.T>;",
  });
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.messages[0].source, 'Hello <c0>Ada</c0>!');
  const ordinary = extractMessages(
    "import {Text} from 'react-native-web'; import {T} from 'lino-i18n/react'; <T>Hello <Text>Ada</Text>!</T>;"
  );
  assert.equal(ordinary.messages[0].source, 'Hello {c0}!');
});

test('Native storage initialization deduplicates and yields to later locale choices', async () => {
  const stored = deferred();
  let reads = 0;
  const writes = [];
  const native = createNativeI18n({
    Text,
    storage: {
      getItem() {
        reads++;
        return stored.promise;
      },
      async setItem(key, value) {
        writes.push([key, value]);
      },
    },
    locales: { fr: { Hello: 'Bonjour' }, de: { Hello: 'Hallo' } },
  });
  const first = native.initialize();
  const second = native.initialize();
  assert.equal(first, second);
  await native.switchLocale('fr');
  stored.resolve('de');
  await first;
  assert.equal(reads, 1);
  assert.equal(native.i18n.getLocale(), 'fr');
  assert.deepEqual(writes, [['lino-locale', 'fr']]);
});

test('Native latest locale selection controls catalogs and persisted writes', async () => {
  const french = deferred();
  const writes = [];
  const native = createNativeI18n({
    Text,
    storage: {
      getItem: () => null,
      setItem: (key, value) => writes.push(value),
    },
    loadCatalog: (locale) =>
      locale === 'fr' ? french.promise : Promise.resolve({ Hello: 'Hallo' }),
  });
  const older = native.switchLocale('fr');
  await native.switchLocale('de');
  french.resolve({ Hello: 'Bonjour' });
  await older;
  assert.equal(native.i18n.getLocale(), 'de');
  assert.deepEqual(writes, ['de']);
  await native.switchLocale('en');
  assert.equal(native.i18n.gt('Hello'), 'Hello');
  assert.deepEqual(writes, ['de', 'en']);
});

test('Native hooks and formatter wrappers emit native Text and retain opaque views', () => {
  const native = createNativeI18n({
    Text,
    defaultLocale: 'fr',
    locales: { fr: { 'Opaque {c0}': '{c0} intact', Hello: 'Bonjour' } },
  });
  function App() {
    const gt = useGT();
    const selector = native.useLocaleSelector();
    return h(
      View,
      null,
      h(Text, null, gt('Hello')),
      h(native.Currency, { value: 0, currency: 'EUR' }),
      h(
        native.T,
        null,
        'Opaque ',
        h(View, { testID: 'opaque' }, h(Text, null, 'Code'))
      ),
      h(Text, null, selector.locale)
    );
  }
  const output = renderToStaticMarkup(h(native.Provider, null, h(App)));
  assert.match(output, /Bonjour/);
  assert.match(output, /0,00/);
  assert.match(output, /data-testid="opaque"/);
  assert.match(output, /intact/);
});

test('Native persistence serializes writes already in flight', async () => {
  const blocked = deferred();
  const started = deferred();
  let persisted;
  const native = createNativeI18n({
    Text,
    locales: { fr: {}, de: {} },
    storage: {
      getItem: () => null,
      async setItem(key, value) {
        if (value === 'fr') {
          started.resolve();
          await blocked.promise;
        }
        persisted = value;
      },
    },
  });
  const french = native.switchLocale('fr');
  await started.promise;
  const german = native.switchLocale('de');
  blocked.resolve();
  await Promise.all([french, german]);
  assert.equal(persisted, 'de');
  assert.equal(native.i18n.getLocale(), 'de');
});

test('Native bootstrap retries storage failures and rejects dynamic rich extraction', async () => {
  let calls = 0;
  const native = createNativeI18n({
    Text,
    storage: {
      getItem() {
        if (++calls === 1) {
          throw new Error('offline storage');
        }
        return 'not a locale!';
      },
      setItem() {},
    },
  });
  await assert.rejects(native.initialize(), /offline storage/);
  assert.equal(await native.initialize(), 'en');
  const result = extractMessages(
    `import {createNativeI18n} from 'lino-i18n/react-native'; const native = createNativeI18n({Text: Label}); <native.T><Label>Hello</Label></native.T>;`
  );
  assert.match(result.diagnostics[0].message, /imported Text|explicit source/);
});
