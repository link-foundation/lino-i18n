import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as tooling from '../src/tooling.js';
import { extractFiles } from '../src/tooling-files.js';

test('file extraction follows an imported translator without executing application modules', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'lino-imports-'));
  try {
    await writeFile(
      path.join(directory, 'i18n.ts'),
      `import { createTranslator } from 'lino-i18n/messages';
       export const i18n = createTranslator();
       throw new Error('Application modules must never execute');`
    );
    await writeFile(
      path.join(directory, 'app.ts'),
      `import { i18n } from './i18n.js'; i18n.gt('Imported source');`
    );
    const result = await extractFiles(directory);
    assert.deepEqual(result.diagnostics, []);
    assert.deepEqual(
      result.messages.map(({ source }) => source),
      ['Imported source']
    );
    await writeFile(
      path.join(directory, 'unrelated.ts'),
      `import { msg } from 'lino-i18n/messages'; msg('Unrelated file');`
    );
    const single = await extractFiles(path.join(directory, 'app.ts'));
    assert.deepEqual(
      single.messages.map(({ source }) => source),
      ['Imported source']
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('exported destructured source functions preserve aliases and conflicting star exports diagnose', () => {
  const result = tooling.extractProject({
    'factory.ts': `import { createTranslator } from 'lino-i18n/messages'; export const { gt, m } = createTranslator();`,
    'barrel.ts': `export { gt as translate } from './factory';`,
    'app.ts': `import { translate } from './barrel'; import { m } from './factory'; translate('Alias'); m('Message');`,
  });
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    ['Alias', 'Message']
  );
  const conflict = tooling.extractProject({
    'a.ts': `export { msg as text } from 'lino-i18n/messages';`,
    'b.ts': `export const text = (value) => value;`,
    'barrel.ts': `export * from './a'; export * from './b';`,
    'app.ts': `import { text } from './barrel'; text('Ambiguous');`,
  });
  assert.equal(conflict.messages.length, 0);
  assert.match(conflict.diagnostics[0].message, /Ambiguous exported name/);
});

test('project extraction resolves barrels, namespaces, defaults, Next accessors and shadowing', () => {
  assert.equal(typeof tooling.extractProject, 'function');
  const result = tooling.extractProject({
    'factory.ts': `import { createNextI18n } from 'lino-i18n/next/server'; export default createNextI18n({});`,
    'barrel.ts': `export { default as i18n } from './factory'; export { T, Var } from 'lino-i18n/react';`,
    'app.tsx': `import * as shared from './barrel.js';
      const gt = await shared.i18n.getGT(); gt('Imported Next');
      const node = <shared.T>Hello <shared.Var name="name">{name}</shared.Var></shared.T>;
      function shadow(shared) { shared.i18n.getGT()('Ignore'); }`,
  });
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    ['Hello {name}', 'Imported Next']
  );
});

test('project derivation uses imported functions and dictionaries in their declaration scope', () => {
  const result = tooling.extractProject({
    'copy.ts': `const yes = 'Ready'; export function status(value) { return value ? yes : 'Waiting'; }
      export const labels = { open: 'Open', closed: 'Closed' };`,
    'app.ts': `import { createTranslator, derive } from 'lino-i18n/messages';
      import { status, labels } from './copy'; const { gt } = createTranslator();
      gt('Status: {value}', { value: derive(status(flag)) });
      gt('Door: {value}', { value: derive(labels[state]) });`,
  });
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    ['Door: Closed', 'Door: Open', 'Status: Ready', 'Status: Waiting']
  );
});

test('project dictionaries resolve imported plain schemas and registered descriptors only once', () => {
  const result = tooling.extractProject({
    'copy.ts': `import { defineDictionary, msg } from 'lino-i18n/messages';
      export const plain = { buttons: ['Save', 'Cancel'] };
      export const schema = defineDictionary({ heading: 'Welcome' });
      export const message = msg('Deferred');`,
    'app.ts': `import { createDictionaryTranslator, createTranslator } from 'lino-i18n/messages';
      import { plain, schema, message } from './copy';
      const i18n = createDictionaryTranslator(plain);
      const second = createDictionaryTranslator(schema);
      const third = createTranslator(); third.gt(message);`,
  });
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.messages.map(({ id }) => id),
    ['buttons.0', 'buttons.1', 'Deferred', 'heading']
  );
});

test('cyclic imports terminate and missing or ambiguous message imports diagnose without false positives', () => {
  const result = tooling.extractProject({
    'a.ts': `export { value } from './b';`,
    'b.ts': `export { value } from './a';`,
    'app.ts': `import { createTranslator, derive } from 'lino-i18n/messages';
      import { value } from './a'; const { gt } = createTranslator();
      gt('Value: {value}', { value: derive(value) });`,
  });
  assert.equal(result.messages.length, 0);
  assert.equal(result.diagnostics.length, 1);
  assert.match(result.diagnostics[0].message, /cycle|resolve|statically/i);
  assert.throws(
    () => tooling.extractProject({ 'a.ts': 'const x = 1' }, { maxFiles: 0 }),
    /limit|positive/i
  );
  assert.throws(
    () => tooling.extractProject({ 'a.ts': 'const x = 1' }, { maxBytes: 4 }),
    /limit/i
  );
  const missing = tooling.extractProject({
    'app.ts': `import { i18n } from './missing'; i18n.gt('Missing');`,
  });
  assert.match(missing.diagnostics[0].message, /Cannot resolve local import/);
  const ambiguous = tooling.extractProject({
    'app.ts': `import { i18n } from './factory'; i18n.gt('Ambiguous');`,
    'factory.ts': `export const i18n = {};`,
    'factory.js': `export const i18n = {};`,
  });
  assert.match(ambiguous.diagnostics[0].message, /Ambiguous local import/);
});

test('custom project resolution preserves bundler aliases and ignores type-only APIs', () => {
  const result = tooling.extractProject(
    {
      'factory.ts': `import { createTranslator } from 'lino-i18n/messages'; export const i18n = createTranslator();`,
      'app.ts': `import { i18n } from '@/factory'; import type { msg } from 'lino-i18n/messages';
      i18n.gt('Bundler alias'); msg('Ignore invalid type-only usage');`,
    },
    {
      resolveImport: (source) =>
        source === '@/factory' ? 'factory.ts' : undefined,
    }
  );
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.messages[0].source, 'Bundler alias');
});

test('the real Next fixture extracts shared server factories and excludes generated bundles', async () => {
  const result = await extractFiles(
    new URL('../examples/next-usage/', import.meta.url)
  );
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    [
      'A <c0>localized</c0> page',
      'Count {count}',
      'Hello {name}',
      'Hello from the server',
      'Static page',
    ]
  );
  assert.ok(result.messages.every(({ file }) => !file.includes('.next')));
});
