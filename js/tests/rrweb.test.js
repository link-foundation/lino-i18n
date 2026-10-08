import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { test } from 'test-anywhere';
import { flattenEntry, harvestLocales } from 'gt-rrweb/harvest';
import { toReplayCatalog, createReplayLoader } from '../src/rrweb/catalog.js';
import { harvestReplay } from '../src/rrweb/harvest.js';
import { T } from '../src/rrweb/index.js';
import { I18nProvider, Var } from '../src/react.js';
import { createTranslator } from '../src/messages.js';
import { extractMessages } from '../src/extract.js';

const h = React.createElement;
const sources = {
  greeting: 'Hello <c0>{name}</c0>!',
  balance: 'Balance: {n, number}',
};
const catalog =
  'fr\n  greeting "Bonjour <c0>{name}</c0> !"\n  Heading "Titre"\n  Ada "Adele"\n';
function textNode(id, textContent) {
  return { type: 3, id, textContent };
}
function recording() {
  return [
    {
      type: 4,
      timestamp: 1,
      data: { href: 'https://example.test/', width: 800, height: 600 },
    },
    {
      type: 2,
      timestamp: 2,
      data: {
        initialOffset: { top: 0, left: 0 },
        node: {
          type: 0,
          id: 1,
          childNodes: [
            {
              type: 2,
              id: 2,
              tagName: 'span',
              attributes: { 'data-_gt-hash': 'greeting' },
              childNodes: [
                textNode(3, 'Hello '),
                textNode(4, 'Ada'),
                textNode(5, '!'),
              ],
            },
            textNode(6, 'Heading'),
          ],
        },
      },
    },
    {
      type: 3,
      timestamp: 3,
      data: {
        source: 0,
        adds: [],
        removes: [],
        attributes: [],
        texts: [{ id: 6, value: 'Heading' }],
      },
    },
  ];
}

test('replay catalogs turn actual ICU into GT leaves and select locale roots safely', async () => {
  const dict = toReplayCatalog(catalog, { locale: 'fr', sources });
  assert.deepEqual(flattenEntry(dict.greeting), [
    { text: 'Bonjour ' },
    { variable: true },
    { text: ' !' },
  ]);
  assert.equal(dict.Heading, 'Titre');
  assert.deepEqual(
    flattenEntry(
      toReplayCatalog({ '<c0>Hello</c0> world': '<c0>Bonjour</c0> monde' })[
        '<c0>Hello</c0> world'
      ]
    ),
    [{ text: 'Bonjour' }, { text: ' monde' }]
  );
  const proto = toReplayCatalog('fr\n  __proto__ "propre"\n', { locale: 'fr' });
  assert.equal(Object.getPrototypeOf(proto), null);
  assert.equal(proto.__proto__, 'propre');
  assert.throws(
    () => toReplayCatalog('en\n  Hello "Hello"\nfr\n  Hello "Bonjour"\n'),
    /locale/i
  );
  assert.throws(() => toReplayCatalog(catalog, { locale: 'de' }), /locale/i);
  const load = createReplayLoader(async () => catalog, { sources });
  assert.equal((await load('fr')).Heading, 'Titre');
});

test('replay leaves keep source on variable reordering, branch selection and structural drift', () => {
  const dict = toReplayCatalog(
    {
      greeting: '{name} vous dit bonjour !',
      balance: 'Solde : {n, number}',
      '{n, plural, one {One} other {Many}}':
        '{n, plural, one {Un} other {Plusieurs}}',
      '{a} and {b}': '{b} et {a}',
    },
    { sources }
  );
  assert.equal(dict.greeting, null);
  assert.deepEqual(flattenEntry(dict.balance), [
    { text: 'Solde : ' },
    { variable: true },
  ]);
  assert.equal(dict['{n, plural, one {One} other {Many}}'], null);
  assert.equal(dict['{a} and {b}'], null);
  assert.throws(() => toReplayCatalog({ broken: '{unclosed' }), /ICU|message/i);
});

test('replay harvest preserves variables, source events and source-first locale semantics', async () => {
  const events = recording();
  const before = globalThis.structuredClone(events);
  const loaded = [];
  const overlay = await harvestReplay(events, ['en', 'fr', 'de'], {
    sourceLocale: 'en',
    sources,
    loadCatalog: async (locale) => {
      loaded.push(locale);
      if (locale === 'de') {
        throw new Error('Offline');
      }
      return catalog;
    },
  });
  assert.deepEqual(overlay.fr, { 3: 'Bonjour ', 5: ' !', 6: 'Titre' });
  assert.deepEqual(overlay.de, {});
  assert.equal(
    Object.hasOwn(overlay.fr, 4),
    false,
    'a variable named in the catalog stays recorded'
  );
  assert.deepEqual(events, before);
  assert.deepEqual(loaded, ['fr', 'de']);
  const upstream = await harvestLocales(events, ['en', 'fr'], {
    loadTranslations: createReplayLoader(async () => catalog, { sources }),
    hashMessage: (text) => text,
  });
  assert.equal(
    upstream.fr[4],
    'Adele',
    'reproduces the published harvester variable fallback'
  );
});

test('replay budgets reject finite oversized, deeply nested and cyclic inputs before traversal', async () => {
  const events = recording();
  await assert.rejects(
    harvestReplay(events, ['en'], { maxEvents: 2 }),
    /events/i
  );
  await assert.rejects(
    harvestReplay(events, ['en'], { maxTextBytes: 4 }),
    /text/i
  );
  let node = textNode(70, 'End');
  for (let id = 69; id > 40; id -= 1) {
    node = { type: 2, id, childNodes: [node] };
  }
  events[1].data.node = node;
  await assert.rejects(
    harvestReplay(events, ['en'], { maxDepth: 20 }),
    /depth/i
  );
  node.childNodes.push(node);
  await assert.rejects(harvestReplay(events, ['en']), /cycle/i);
  assert.throws(
    () => toReplayCatalog('fr\n  A "😀😀"', { maxCatalogBytes: 8 }),
    /bytes/i
  );
  assert.throws(
    () => toReplayCatalog({ A: 'a', B: 'b' }, { maxEntries: 1 }),
    /entries/i
  );
  assert.throws(
    () => toReplayCatalog({ A: 'long message' }, { maxMessageBytes: 4 }),
    /maxMessageBytes/
  );
  assert.throws(
    () =>
      toReplayCatalog(
        { A: `${'<x>'.repeat(30)}end${'</x>'.repeat(30)}` },
        { maxDepth: 20 }
      ),
    /maxDepth/
  );
});

test('replay T carries the same structural source identity as runtime and JSX extraction', () => {
  const i18n = createTranslator();
  const html = renderToStaticMarkup(
    h(
      I18nProvider,
      { i18n },
      h(
        T,
        null,
        'Hello ',
        h('strong', null, h(Var, { name: 'name' }, 'Ada')),
        '!'
      )
    )
  );
  assert.match(html, /data-_gt-hash="Hello &lt;c0&gt;\{name\}&lt;\/c0&gt;!"/);
  assert.match(
    html,
    /Hello <strong><span[^>]*data-lino-var="name"[^>]*>Ada<\/span><\/strong>!/
  );
  const result = extractMessages(
    "import { T, Var } from 'lino-i18n/rrweb'; const view = <T>Hello <strong><Var name='name'>Ada</Var></strong>!</T>"
  );
  assert.equal(result.messages[0].id, 'Hello <c0>{name}</c0>!');
  assert.throws(
    () =>
      renderToStaticMarkup(
        h(I18nProvider, { i18n }, h(T, { source: 'Missing {name}' }))
      ),
    /name/
  );
});
