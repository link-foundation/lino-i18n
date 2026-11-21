import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { formatLinoCatalog, parseLinoCatalog } from 'lino-i18n';
import { decode, encode } from 'lino-objects-codec';

const [codecVersion, catalogPath] = process.argv.slice(2);
const requireFromApp = createRequire(import.meta.url);
const requireFromI18n = createRequire(import.meta.resolve('lino-i18n'));
assert.equal(
  requireFromI18n.resolve('lino-objects-codec'),
  requireFromApp.resolve('lino-objects-codec'),
  'the app and lino-i18n must resolve the same codec'
);
const { version } = JSON.parse(
  readFileSync('node_modules/lino-objects-codec/package.json', 'utf8')
);
if (codecVersion) {
  assert.equal(version, codecVersion);
} else {
  assert.match(version, /^0\.9\./);
}

const extracted = parseLinoCatalog(readFileSync('locales/en.lino', 'utf8'));
const sourceMessages = [
  'A <c0>localized</c0> page',
  'Count {count}',
  'Hello {name}',
  'Hello from the server',
  'Static page',
];
assert.deepEqual(extracted, {
  locale: 'en',
  translations: Object.fromEntries(
    sourceMessages.map((source) => [source, source])
  ),
});

const sample = parseLinoCatalog(readFileSync(catalogPath, 'utf8'));
assert.equal(sample.translations['cart.items_one'], '{{count}} item');
for (const catalog of [extracted, sample]) {
  const notation = encode({ obj: catalog });
  const decoded = decode({ notation });
  assert.deepEqual(decoded, catalog);
  assert.deepEqual(
    parseLinoCatalog(formatLinoCatalog(decoded.locale, decoded.translations)),
    catalog
  );
}
console.log(`Codec ${version} passed extraction and catalog round-trips`);
