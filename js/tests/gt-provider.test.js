import test from 'node:test';
import assert from 'node:assert/strict';
import * as adapter from '../src/providers/gt.js';
import { translateCatalog } from '../src/tooling.js';

test('GT provider batches ICU metadata and preserves approved translations', async () => {
  const calls = [];
  const sdk = {
    async translateMany(entries, options, timeout) {
      calls.push({ entries, options, timeout });
      return entries.map((entry) => ({
        success: true,
        translation: `Bonjour ${entry.source}`,
        dataFormat: 'ICU',
        locale: 'fr',
      }));
    },
  };
  const provider = adapter.createGTProvider(sdk, {
    batchSize: 1,
    timeout: 1234,
  });
  const result = await translateCatalog(
    [
      {
        id: 'greeting',
        source: 'Hello {name}',
        description: 'Personal welcome',
      },
      { id: 'save', source: 'Save' },
      { id: 'approved', source: 'Approved' },
    ],
    { approved: 'Validé' },
    { locale: 'fr', provider }
  );
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].entries[0], {
    source: 'Hello {name}',
    metadata: {
      id: 'greeting',
      context: 'Personal welcome',
      dataFormat: 'ICU',
    },
  });
  assert.deepEqual(calls[0].options, {
    sourceLocale: 'en',
    targetLocale: 'fr',
  });
  assert.equal(calls[0].timeout, 1234);
  assert.equal(result.translations.approved, 'Validé');
  assert.equal(result.translations.greeting, 'Bonjour Hello {name}');
  for (const translation of [
    { success: false, code: 429 },
    { success: true, translation: 'missing variable', dataFormat: 'ICU' },
    undefined,
  ]) {
    const invalid = adapter.createGTProvider({
      translateMany: async () => [translation],
    });
    await assert.rejects(
      invalid([{ id: 'greeting', source: 'Hello {name}' }], { locale: 'fr' }),
      /GT translation|variables/
    );
  }
});

test('GT catalog loader pins versions and source uploads use the supported JSON ICU format', async () => {
  const calls = [];
  const sdk = {
    async downloadFile(query, options) {
      calls.push({ query, options });
      return JSON.stringify({ greeting: 'Bonjour {name}' });
    },
  };
  const loader = adapter.createGTCatalogLoader(sdk, {
    fileId: 'file',
    branchId: 'preview',
    timeout: 1234,
  });
  assert.deepEqual(await loader('fr', { version: 'v2' }), {
    greeting: 'Bonjour {name}',
  });
  assert.deepEqual(calls[0], {
    query: {
      fileId: 'file',
      branchId: 'preview',
      locale: 'fr',
      versionId: 'v2',
    },
    options: { timeout: 1234 },
  });
  await loader('fr', { version: 'default' });
  assert.equal(calls[1].query.versionId, undefined);
  const file = adapter.createGTSourceFile(
    [{ id: 'hello', source: 'Hello {name}' }],
    { sourceLocale: 'en', fileName: 'app.json', branchId: 'preview' }
  );
  assert.equal(file.fileFormat, 'JSON');
  assert.equal(file.dataFormat, 'ICU');
  assert.deepEqual(JSON.parse(file.content), { hello: 'Hello {name}' });
  assert.throws(
    () =>
      adapter.createGTSourceFile([
        { id: 'hello', source: 'Hi' },
        { id: 'hello', source: 'Hello' },
      ]),
    /Conflicting/
  );
  await assert.rejects(
    adapter.createGTCatalogLoader(
      { downloadFile: async () => '{"bad":42}' },
      { fileId: 'file' }
    )('fr'),
    /string table/
  );
});
