import assert from 'node:assert/strict';
import { test } from 'test-anywhere';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { commandExtract, extractFiles } from '../src/tooling-files.js';
import {
  extractPythonMessages,
  extractPythonProject,
} from '../src/python-extract.js';

test('Python imports, aliases and source metadata produce shared manifests', async () => {
  const result = await extractPythonMessages(
    `from gt_flask import t as translate, msg\nimport gt_fastapi as gt\ntranslate("Hello {name}", name="Ada", _id="hello", _context="Greeting")\ngt.t("Namespace")\nmsg("Deferred")\n`,
    { file: 'app.py' }
  );
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.messages[0], {
    id: 'hello',
    source: 'Hello {name}',
    description: 'Greeting',
    variables: ['name'],
    file: 'app.py',
    line: 3,
    column: 1,
  });
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    ['Hello {name}', 'Namespace', 'Deferred']
  );
});

test('Python lexical shadowing includes function, comprehension and class scopes', async () => {
  const source = `from gt_flask import t\ndef unrelated(t):\n    t("Parameter")\ndef local():\n    t("Local assignment")\n    t = lambda x: x\n[t("Comprehension") for t in funcs]\nclass Container:\n    t = lambda x: x\n    t("Class local")\n    def method(self):\n        t("Global import in method")\nt("Extract")\n`;
  const result = await extractPythonMessages(source);
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    ['Global import in method', 'Extract']
  );
});

test('Python finite derivation expands local returns and dictionaries without execution', async () => {
  const result = await extractPythonMessages(
    `from gt_fastapi import t, derive\nLABELS = {"cat": "Cat", "dog": "Dog"}\ndef greeting():\n    if input():\n        return "Day"\n    return "Night"\nraise RuntimeError("must never execute")\nt(f"Hello {derive(greeting())}: {derive(LABELS[animal])}")\n`
  );
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    ['Hello Day: Cat', 'Hello Day: Dog', 'Hello Night: Cat', 'Hello Night: Dog']
  );
});

test('Python dynamic f-strings, malformed syntax and ambiguous ids diagnose', async () => {
  const dynamic = await extractPythonMessages(
    'from gt_flask import t\nt(f"Hello {name}")\n'
  );
  assert.match(dynamic.diagnostics[0].message, /derive|dynamic/i);
  const syntax = await extractPythonMessages(
    'from gt_flask import t\nt("bad"\n'
  );
  assert.equal(syntax.messages.length, 0);
  assert.equal(syntax.diagnostics[0].line, 2);
  assert.match(syntax.diagnostics[0].message, /syntax/i);
  const id = await extractPythonMessages(
    `from gt_flask import t, derive\nt(f'{derive("cat" if cond else "dog")}', _id="same")\n`
  );
  assert.match(id.diagnostics[0].message, /id/i);
});

test('Python literals preserve decoded escapes, unicode offsets and ICU syntax', async () => {
  const result = await extractPythonMessages(
    'from gt_flask import t\n"😀"; t("Line\\n{count, plural, one {One} other {Many}}")\n'
  );
  assert.equal(result.messages[0].column, 6);
  assert.equal(
    result.messages[0].source,
    'Line\n{count, plural, one {One} other {Many}}'
  );
  assert.deepEqual(result.messages[0].variables, ['count']);
});

test('Python extraction bounds source, AST and finite cross products', async () => {
  await assert.rejects(
    extractPythonMessages('12345', { maxBytes: 4 }),
    /bytes/i
  );
  const products = `from gt_flask import t, derive\nt(f'${'{derive("a" if c else "b")}'.repeat(
    8
  )}')\n`;
  const result = await extractPythonMessages(products);
  assert.match(result.diagnostics[0].message, /variant|limit/i);
  const nested = `from gt_flask import t\nt(${'('.repeat(
    150
  )}"deep"${')'.repeat(150)})\n`;
  const bounded = await extractPythonMessages(nested);
  assert.equal(bounded.messages.length + bounded.diagnostics.length, 1);
});

test('Python CLI file discovery creates shared catalog manifests', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'lino-python-'));
  try {
    await writeFile(
      path.join(directory, 'app.py'),
      'from gt_flask import t\nt("Hello {name}")\n'
    );
    await writeFile(
      path.join(directory, 'ignored.js'),
      'throw new Error("not Python")'
    );
    const manifest = await extractFiles(directory, { syntax: 'python' });
    assert.equal(manifest.messages.length, 1);
    assert.deepEqual(manifest.diagnostics, []);
    const output = path.join(directory, 'out');
    assert.equal(
      await commandExtract(
        { in: directory, out: output, syntax: 'python', locale: 'en' },
        () => {},
        () => {}
      ),
      0
    );
    assert.match(await readFile(path.join(output, 'en.lino'), 'utf8'), /Hello/);
    assert.equal(
      JSON.parse(await readFile(path.join(output, 'messages.json'), 'utf8'))
        .messages.length,
      1
    );
    // Extraction does not mutate application sources.
    assert.match(
      await readFile(path.join(directory, 'app.py'), 'utf8'),
      /from gt_flask/
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Python project conflicts and runtime keyword values remain explicit', async () => {
  const result = await extractPythonProject({
    'a.py': 'from gt_flask import t\nt("Hello {id}", id=value, _id="same")\n',
    'b.py': 'from gt_flask import t\nt("Different", _id="same")\n',
  });
  assert.equal(result.messages[0].source, 'Hello {id}');
  assert.deepEqual(result.messages[0].variables, ['id']);
  assert.match(result.diagnostics[0].message, /Conflicting/);
});
