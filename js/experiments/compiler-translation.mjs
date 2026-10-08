// Verify the actual Rollup plugin, JSX transpilation and React server rendering.
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { rollup } from 'rollup';
import { transform } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nProvider } from '../src/react.js';
import { createTranslator } from '../src/messages.js';
import { createExtractionPlugin } from '../src/compiler.js';
import { parseLinoCatalog } from '../src/catalogs.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const code = `import React from 'react'; import { useGT } from 'lino-i18n/react';
  export function Page({ getName, onClick }) {
    const gt = useGT();
    return <main><p>Hello <strong>{getName()}</strong>!</p>
      <input placeholder="Search" aria-label={\`Search for \${getName()}\`} />
      <button onClick={onClick}>Buy</button></main>;
  }`;
const bundle = await rollup({
  input: '/virtual/app.jsx',
  external: ['react', 'lino-i18n/react'],
  plugins: [
    {
      name: 'fixture',
      resolveId: (id) => (id === '/virtual/app.jsx' ? id : null),
      load: (id) => (id === '/virtual/app.jsx' ? code : null),
    },
    createExtractionPlugin({
      transform: {
        attributes: ['placeholder', 'aria-label'],
        attributeTranslator: 'gt',
      },
    }),
    {
      name: 'jsx',
      transform: (source, id) =>
        transform(source, {
          loader: 'jsx',
          sourcemap: true,
          sourcefile: id,
          format: 'esm',
        }),
    },
  ],
});
await mkdir(resolve(root, 'dist'), { recursive: true });
const directory = await mkdtemp(resolve(root, 'dist/compiler-fixture-'));
try {
  const { output } = await bundle.generate({ format: 'esm', sourcemap: true });
  const catalog = output.find((asset) => asset.fileName === 'locales/en.lino');
  const sources = parseLinoCatalog(catalog.source).translations;
  assert.deepEqual(
    Object.keys(sources).sort(),
    ['Buy', 'Hello <c0>{auto0}</c0>!', 'Search', 'Search for {v0}'].sort()
  );
  const chunk = output.find((asset) => asset.type === 'chunk');
  assert.ok(chunk.map.sourcesContent.includes(code));
  const filename = resolve(directory, 'app.mjs');
  await writeFile(filename, chunk.code);
  const { Page } = await import(pathToFileURL(filename));
  const i18n = createTranslator({
    defaultLocale: 'fr',
    locales: {
      fr: {
        Buy: 'Acheter',
        Search: 'Rechercher',
        'Search for {v0}': 'Rechercher {v0}',
        'Hello <c0>{auto0}</c0>!': 'Bonjour <c0>{auto0}</c0> !',
      },
    },
  });
  let calls = 0;
  const markup = renderToStaticMarkup(
    React.createElement(
      I18nProvider,
      { i18n },
      React.createElement(Page, {
        getName: () => {
          calls += 1;
          return 'Ada';
        },
        onClick() {},
      })
    )
  );
  assert.match(markup, /Bonjour <strong>Ada<\/strong> !/);
  assert.match(markup, /placeholder="Rechercher"/);
  assert.match(markup, /aria-label="Rechercher Ada"/);
  assert.match(markup, /Acheter/);
  assert.equal(calls, 2, 'Each original expression is evaluated once');
  console.log(
    'Rollup transform, source map, attributes and React render verified'
  );
} finally {
  await bundle.close();
  await rm(directory, { recursive: true, force: true });
}
