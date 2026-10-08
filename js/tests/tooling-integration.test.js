import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseLinoCatalog } from '../src/catalogs.js';
import { createTranslator } from '../src/messages.js';

const cli = fileURLToPath(new URL('../bin/lino-i18n.js', import.meta.url));
function run(args) {
  const result = spawnSync('node', [cli, ...args], {
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

test('Rollup emits source catalogs and a manifest without rewriting code', () => {
  const script = fileURLToPath(
    new URL('../experiments/rollup-extraction.mjs', import.meta.url)
  );
  const result = spawnSync('node', [script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr + result.stdout);
});

test('CLI detects translations requiring review after a stable-id source change', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'lino-stale-'));
  try {
    const previous = path.join(directory, 'previous.json');
    const current = path.join(directory, 'current.json');
    await writeFile(
      previous,
      JSON.stringify({
        version: 1,
        messages: [{ id: 'hello', source: 'Hello' }],
      })
    );
    await writeFile(
      current,
      JSON.stringify({
        version: 1,
        messages: [{ id: 'hello', source: 'Welcome' }],
      })
    );
    await writeFile(path.join(directory, 'fr.lino'), 'fr\n  hello Bonjour\n');
    const result = spawnSync(
      'node',
      [
        cli,
        'check',
        '--dir',
        directory,
        '--manifest',
        current,
        '--previous-manifest',
        previous,
      ],
      { encoding: 'utf8' }
    );
    assert.equal(result.status, 2, result.stderr + result.stdout);
    assert.match(result.stdout, /stale/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
