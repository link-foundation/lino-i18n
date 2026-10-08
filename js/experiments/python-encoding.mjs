// Reproduce a non-UTF8 Python pipe encoding without relying on a Windows host.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const request = {
  source: 'from gt_flask import t\n"😀"; t("你好")\n',
  file: 'unicode.py',
  maxVariants: 100,
};
const script = fileURLToPath(
  new URL('../src/python-extract.py', import.meta.url)
);
const result = JSON.parse(
  execFileSync('python3', [script], {
    input: JSON.stringify(request),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
    env: { ...process.env, PYTHONIOENCODING: 'cp1252' },
  })
);
assert.equal(result.messages[0].column, 6);
assert.equal(result.messages[0].source, '你好');
console.log('Explicit UTF-8 parsing preserves Unicode literals and columns.');
