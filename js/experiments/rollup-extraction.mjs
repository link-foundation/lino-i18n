// The build tool runs under Node, including when the suite is run by Deno.
import assert from 'node:assert/strict';
import { rollup } from 'rollup';
import { createExtractionPlugin } from '../src/compiler.js';
import { parseLinoCatalog } from '../src/catalogs.js';

const sources = {
  '/virtual/app.js': `import { msg, derive } from 'lino-i18n/messages';
    import { i18n } from './i18n.js'; import { label } from './copy.js';
    export const text = msg('Add an item'); i18n.gt('Shared');
    i18n.gt('Item {label}', { label: derive(label(flag)) });`,
  '/virtual/i18n.js': `import { createTranslator } from 'lino-i18n/messages'; export const i18n = createTranslator();`,
  '/virtual/copy.js': `export function label(flag) { return flag ? 'One' : 'Two'; }`,
};
const bundle = await rollup({
  input: '/virtual/app.js',
  external: ['lino-i18n/messages'],
  plugins: [
    {
      name: 'fixture',
      resolveId: (id, importer) => {
        const target = id.startsWith('.')
          ? new URL(id, `file://${importer}`).pathname
          : id;
        return Object.hasOwn(sources, target) ? target : null;
      },
      load: (id) => sources[id] || null,
    },
    createExtractionPlugin(),
  ],
});
try {
  const { output } = await bundle.generate({ format: 'esm' });
  const catalog = output.find((asset) => asset.fileName === 'locales/en.lino');
  assert.equal(
    parseLinoCatalog(catalog.source).translations['Add an item'],
    'Add an item'
  );
  assert.equal(
    JSON.parse(
      output.find((asset) => asset.fileName === 'messages.json').source
    ).messages.length,
    4
  );
  assert.equal(parseLinoCatalog(catalog.source).translations.Shared, 'Shared');
  assert.equal(
    parseLinoCatalog(catalog.source).translations['Item Two'],
    'Item Two'
  );
} finally {
  await bundle.close();
}
