import test from 'node:test';
import assert from 'node:assert/strict';
import { Schema } from '@sanity/schema';
import { createClient } from '@sanity/client';
import { createServer } from 'node:http';
import * as upstream from 'gt-sanity';
import {
  gtPlugin,
  exportSanityDocument,
  prepareSanityImport,
  commitSanityImport,
  sanityDocumentKey,
} from 'lino-i18n/sanity';
import { parseLinoCatalogs, formatLinoCatalog } from 'lino-i18n/loaders';
import { setupDOM } from '../../tests/helpers/dom.js';

const schema = Schema.compile({
  name: 'catalog-bridge',
  types: [
    {
      name: 'article',
      type: 'document',
      fields: [
        { name: 'title', type: 'string' },
        {
          name: 'language',
          type: 'string',
          options: { gt: { exclude: true } },
        },
        { name: 'private', type: 'string', options: { gt: { exclude: true } } },
        { name: 'body', type: 'array', of: [{ type: 'block' }] },
      ],
    },
    {
      name: 'localized',
      type: 'object',
      fields: [
        { name: 'en', type: 'string' },
        { name: 'fr', type: 'string' },
      ],
    },
    {
      name: 'localizedArticle',
      type: 'document',
      fields: [
        { name: 'title', type: 'localized' },
        {
          name: 'private',
          type: 'localized',
          options: { gt: { exclude: true } },
        },
      ],
    },
  ],
});
const source = {
  _id: 'article.en',
  _rev: 'source-v1',
  _type: 'article',
  _createdAt: '2026-10-08T00:00:00Z',
  _updatedAt: '2026-10-08T00:00:00Z',
  title: 'Hello',
  language: 'en',
  private: 'source private',
  body: [
    {
      _key: 'block1',
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [
        { _key: 'span1', _type: 'span', marks: ['strong'], text: 'World' },
      ],
    },
  ],
};
const target = {
  ...source,
  _id: 'article.fr',
  _rev: 'target-v1',
  language: 'fr',
  private: 'target private',
};

function translate(document, options = {}) {
  const catalog = exportSanityDocument(document, schema, {
    sourceLocale: 'en',
    ...options,
  });
  const [{ translations }] = parseLinoCatalogs(catalog);
  const key = sanityDocumentKey(document);
  return formatLinoCatalog(
    'fr',
    {
      [key]: translations[key]
        .replaceAll('Hello', 'Bonjour')
        .replaceAll('World', 'Monde'),
    },
    { style: 'flat' }
  );
}

test('Sanity entry preserves actual published plugin identity and exports a revision-bound catalog', () => {
  const restore = setupDOM();
  try {
    assert.equal(gtPlugin, upstream.gtPlugin);
    const before = JSON.stringify(source);
    const [{ locale, translations }] = parseLinoCatalogs(
      exportSanityDocument(source, schema, { sourceLocale: 'en' })
    );
    assert.equal(locale, 'en');
    const html = translations[sanityDocumentKey(source)];
    assert.match(html, /Hello/);
    assert.match(html, /World/);
    assert.doesNotMatch(html, /source private/);
    assert.match(html, /source-v1/);
    assert.equal(JSON.stringify(source), before);
  } finally {
    restore();
  }
});

test('document imports preserve target metadata, exclusions and Portable Text keys and marks', () => {
  const restore = setupDOM();
  try {
    const before = JSON.stringify(target);
    const raw = upstream
      .BaseDocumentSerializer(schema)
      .serializeDocument(source);
    const decoded = upstream.BaseDocumentDeserializer.deserializeDocument(
      raw.content
    );
    assert.notEqual(
      decoded.body[0].children[0]._key,
      'span1',
      'published decoder regenerates span keys'
    );
    const plan = prepareSanityImport(
      source,
      target,
      schema,
      translate(source),
      { locale: 'fr', sourceLocale: 'en' }
    );
    assert.equal(plan.documentId, target._id);
    assert.equal(plan.revision, target._rev);
    assert.equal(plan.set.title, 'Bonjour');
    assert.equal(plan.set.body[0]._key, 'block1');
    assert.equal(plan.set.body[0].children[0]._key, 'span1');
    assert.equal(plan.set.body[0].children[0].text, 'Monde');
    assert.deepEqual(plan.set.body[0].children[0].marks, ['strong']);
    assert.equal(plan.set.private, undefined);
    assert.equal(plan.set._id, undefined);
    assert.equal(JSON.stringify(target), before);
  } finally {
    restore();
  }
});

test('field localization honors excluded localized fields and returns target-locale patch paths', () => {
  const restore = setupDOM();
  try {
    const doc = {
      ...source,
      _type: 'localizedArticle',
      title: { _type: 'localized', en: 'Hello', fr: 'Salut' },
      private: { _type: 'localized', en: 'do not translate', fr: 'preserve' },
    };
    const original = exportSanityDocument(doc, schema, {
      sourceLocale: 'en',
      mode: 'field',
    });
    const baseline = upstream
      .BaseDocumentSerializer(schema)
      .serializeDocument(doc, 'field', 'en');
    assert.doesNotMatch(
      baseline.content,
      /do not translate/,
      'published serializer honors the schema exclusion'
    );
    assert.doesNotMatch(original, /do not translate/);
    const plan = prepareSanityImport(
      doc,
      doc,
      schema,
      translate(doc, { mode: 'field' }),
      { locale: 'fr', sourceLocale: 'en', mode: 'field' }
    );
    assert.deepEqual(plan.set, { 'title.fr': 'Bonjour' });
  } finally {
    restore();
  }
});

test('document imports reject target arrays that lost source block keys', () => {
  const restore = setupDOM();
  try {
    assert.throws(
      () =>
        prepareSanityImport(
          source,
          { ...target, body: [] },
          schema,
          translate(source),
          { sourceLocale: 'en', locale: 'fr' }
        ),
      /target.*array.*key/i
    );
  } finally {
    restore();
  }
});

test('catalog imports reject stale revisions, markup edits, field injection and source-document overwrites', () => {
  const restore = setupDOM();
  try {
    const catalog = translate(source);
    const options = { locale: 'fr', sourceLocale: 'en' };
    assert.throws(
      () =>
        prepareSanityImport(
          { ...source, _rev: 'new-source' },
          target,
          schema,
          catalog,
          options
        ),
      /revision|missing/i
    );
    assert.throws(
      () => prepareSanityImport(source, source, schema, catalog, options),
      /source document/i
    );
    assert.throws(
      () =>
        prepareSanityImport(source, target, schema, catalog, {
          locale: 'en',
          sourceLocale: 'en',
        }),
      /target locale/i
    );
    const [{ translations }] = parseLinoCatalogs(catalog);
    for (const html of [
      translations[sanityDocumentKey(source)].replace(
        'class="title"',
        'class="private"'
      ),
      translations[sanityDocumentKey(source)].replace(
        '</body>',
        '<script>bad()</script></body>'
      ),
    ]) {
      const changed = formatLinoCatalog(
        'fr',
        { [sanityDocumentKey(source)]: html },
        { style: 'flat' }
      );
      assert.throws(
        () => prepareSanityImport(source, target, schema, changed, options),
        /structure|attribute/i
      );
    }
  } finally {
    restore();
  }
});

test('Sanity bridge rejects finite oversize/deep/cyclic/non-JSON data and missing locale catalogs', () => {
  const restore = setupDOM();
  try {
    assert.throws(
      () =>
        exportSanityDocument(source, schema, {
          sourceLocale: 'en',
          maxBytes: 20,
        }),
      /byte/
    );
    assert.throws(
      () =>
        exportSanityDocument(
          { ...source, extra: Array(1001).fill('x') },
          schema,
          { sourceLocale: 'en' }
        ),
      /arrays.*1000/i
    );
    const cycle = { ...source };
    cycle.extra = cycle;
    assert.throws(
      () => exportSanityDocument(cycle, schema, { sourceLocale: 'en' }),
      /cycle/
    );
    let extra = {};
    for (let n = 0; n < 15; n++) {
      extra = { extra };
    }
    assert.throws(
      () =>
        exportSanityDocument({ ...source, extra }, schema, {
          sourceLocale: 'en',
          maxDepth: 10,
        }),
      /depth/
    );
    const polluted = {
      ...source,
      extra: JSON.parse('{"__proto__":{"bad":true}}'),
    };
    assert.throws(
      () => exportSanityDocument(polluted, schema, { sourceLocale: 'en' }),
      /reserved/
    );
    for (const extra of [Infinity, undefined, () => {}]) {
      assert.throws(
        () =>
          exportSanityDocument({ ...source, extra }, schema, {
            sourceLocale: 'en',
          }),
        /JSON values/
      );
    }
    const accessor = { ...source };
    Object.defineProperty(accessor, 'extra', {
      enumerable: true,
      get() {
        throw new Error('must not execute');
      },
    });
    assert.throws(
      () => exportSanityDocument(accessor, schema, { sourceLocale: 'en' }),
      /accessors/
    );
    assert.throws(
      () =>
        prepareSanityImport(source, target, schema, translate(source), {
          locale: 'de',
          sourceLocale: 'en',
        }),
      /locale/
    );
  } finally {
    restore();
  }
});

test('explicit commit uses the actual Sanity client with a revision-guarded loopback mutation', async () => {
  const restore = setupDOM();
  let received;
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }
    received = JSON.parse(Buffer.concat(chunks).toString());
    response.setHeader('content-type', 'application/json');
    response.end(
      JSON.stringify({
        transactionId: 'local-test',
        results: [
          { id: target._id, document: { ...target, title: 'Bonjour' } },
        ],
      })
    );
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const plan = prepareSanityImport(
      source,
      target,
      schema,
      translate(source),
      { locale: 'fr', sourceLocale: 'en' }
    );
    const client = createClient({
      projectId: 'localtest',
      dataset: 'test',
      apiVersion: '2026-10-08',
      apiHost: `http://127.0.0.1:${server.address().port}`,
      useProjectHostname: false,
      useCdn: false,
    });
    await commitSanityImport(client, plan);
    assert.equal(received.mutations[0].patch.id, target._id);
    assert.equal(received.mutations[0].patch.ifRevisionID, target._rev);
    assert.equal(received.mutations[0].patch.set.title, 'Bonjour');
    assert.equal(received.mutations[0].patch.set.private, undefined);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    restore();
  }
});
