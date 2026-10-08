// The build tool runs under Node, including when the suite is run by Deno.
import assert from 'node:assert/strict';
import { rollup } from 'rollup';
import { createExtractionPlugin } from '../src/compiler.js';
import { parseLinoCatalog } from '../src/catalogs.js';

const code = `import { msg } from 'lino-i18n/messages'; export const text = msg('Add an item');`;
const bundle = await rollup({
  input: '/virtual/app.js',
  external: ['lino-i18n/messages'],
  plugins: [
    {
      name: 'fixture',
      resolveId: (id) => (id === '/virtual/app.js' ? id : null),
      load: (id) => (id === '/virtual/app.js' ? code : null),
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
    1
  );
} finally {
  await bundle.close();
}
