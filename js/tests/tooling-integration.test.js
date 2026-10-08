import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { rollup } from 'rollup';
import { createExtractionPlugin } from '../src/compiler.js';
import { parseLinoCatalog } from '../src/catalogs.js';
import { createTranslator } from '../src/messages.js';

const cli = fileURLToPath(new URL('../bin/lino-i18n.js', import.meta.url));
function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  return result.stdout;
}

test('CLI extraction, validation and provider candidates work end to end', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'lino-extract-'));
  try {
    const source = path.join(directory, 'app.tsx');
    const catalogs = path.join(directory, 'locales');
    const manifest = path.join(catalogs, 'messages.json');
    const provider = path.join(directory, 'provider.mjs');
    await writeFile(
      source,
      `import { msg } from 'lino-i18n/messages'; msg('Hello {name}');`
    );
    run(['extract', '--in', source, '--out', catalogs]);
    await writeFile(
      provider,
      `export default async (messages) => Object.fromEntries(messages.map(({ id }) => [id, 'Bonjour {name}']));`
    );
    run([
      'translate-catalog',
      '--manifest',
      manifest,
      '--dir',
      catalogs,
      '--locale',
      'fr',
      '--provider',
      provider,
      '--out',
      path.join(catalogs, 'fr.lino'),
    ]);
    assert.match(
      run(['check', '--dir', catalogs, '--manifest', manifest]),
      /match/
    );
    const { translations } = parseLinoCatalog(
      await readFile(path.join(catalogs, 'fr.lino'), 'utf8')
    );
    assert.equal(
      createTranslator({
        defaultLocale: 'fr',
        locales: { fr: translations },
      }).gt('Hello {name}', { name: 'Ada' }),
      'Bonjour Ada'
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Rollup emits source catalogs and a manifest without rewriting code', async () => {
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
    const catalog = output.find(
      (asset) => asset.fileName === 'locales/en.lino'
    );
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
});
