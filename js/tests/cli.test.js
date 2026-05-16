import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { runCli } from '../bin/lino-i18n.js';

async function makeTempDir(prefix) {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

function makeIO() {
  const stdout = [];
  const stderr = [];
  return {
    io: {
      log: (...args) => stdout.push(args.join(' ')),
      err: (...args) => stderr.push(args.join(' ')),
    },
    stdout,
    stderr,
  };
}

test('convert i18next JSON to .lino', async () => {
  const tmp = await makeTempDir('lino-i18n-convert-');
  const inDir = path.join(tmp, 'in');
  const outDir = path.join(tmp, 'out');
  await fs.mkdir(inDir, { recursive: true });
  await fs.writeFile(
    path.join(inDir, 'en.json'),
    JSON.stringify({
      greeting: 'Hello, {{name}}',
      cart: { items_one: '{{count}} item', items_other: '{{count}} items' },
    })
  );

  const { io, stdout } = makeIO();
  const code = await runCli(
    ['convert', '--in', inDir, '--out', outDir, '--from', 'i18next'],
    io
  );
  assert.equal(code, 0, stdout.join('\n'));

  const enText = await fs.readFile(path.join(outDir, 'en.lino'), 'utf8');
  assert.match(enText, /^en/);
  assert.match(enText, /greeting ['"]Hello, \{\{name\}\}['"]/);
  assert.match(enText, /cart\.items_one ['"]\{\{count\}\} item['"]/);
  assert.match(enText, /cart\.items_other ['"]\{\{count\}\} items['"]/);

  await fs.rm(tmp, { recursive: true, force: true });
});

test('check reports missing keys against a reference locale', async () => {
  const tmp = await makeTempDir('lino-i18n-check-');
  await fs.writeFile(
    path.join(tmp, 'en.lino'),
    ['en', '  hello "Hello"', '  bye "Goodbye"', ''].join('\n')
  );
  await fs.writeFile(
    path.join(tmp, 'ru.lino'),
    ['ru', '  hello "Привет"', '  extra "лишний"', ''].join('\n')
  );
  const { io, stdout } = makeIO();
  const code = await runCli(['check', '--dir', tmp, '--reference', 'en'], io);
  assert.equal(code, 2, 'should exit with code 2 when issues exist');
  const text = stdout.join('\n');
  assert.match(text, /# ru/);
  assert.match(text, /missing: bye/);
  assert.match(text, /unknown: extra/);
  await fs.rm(tmp, { recursive: true, force: true });
});

test('t command translates a key with parameters', async () => {
  const tmp = await makeTempDir('lino-i18n-t-');
  await fs.writeFile(
    path.join(tmp, 'en.lino'),
    [
      'en',
      '  greeting "Hello, {{name}}!"',
      '  cart.items_one "{{count}} item"',
      '  cart.items_other "{{count}} items"',
      '',
    ].join('\n')
  );

  const { io: io1, stdout: out1 } = makeIO();
  let code = await runCli(
    ['t', '--dir', tmp, '--locale', 'en', 'greeting', 'name=World'],
    io1
  );
  assert.equal(code, 0);
  assert.equal(out1.join('\n'), 'Hello, World!');

  const { io: io2, stdout: out2 } = makeIO();
  code = await runCli(
    ['t', '--dir', tmp, '--locale', 'en', 'cart.items', 'count=5'],
    io2
  );
  assert.equal(code, 0);
  assert.equal(out2.join('\n'), '5 items');

  await fs.rm(tmp, { recursive: true, force: true });
});
