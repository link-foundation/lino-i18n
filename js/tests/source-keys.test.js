import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLinoCatalog, parseLinoCatalog } from '../src/catalogs.js';

test('source-message keys round-trip whitespace, quoting and escaped newlines', () => {
  const translations = {
    'Add an item': 'Ajouter un article',
    '"Hello" {name}': 'Bonjour {name}',
    '# comment': 'Text',
    'line\nbreak': 'Lines',
    'path\\file': 'Path',
  };
  for (const style of ['flat', 'nested']) {
    const text = formatLinoCatalog('fr', translations, { style });
    assert.deepEqual(parseLinoCatalog(text).translations, translations);
  }
  assert.throws(() => parseLinoCatalog('en\n  "broken key value'), /key/);
});
