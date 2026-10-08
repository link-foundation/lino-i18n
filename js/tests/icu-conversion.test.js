import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '@formatjs/icu-messageformat-parser';
import { fromReactIntl } from '../src/converters/react-intl.js';
import { createTranslator, msg } from '../src/messages.js';

test('compiled FormatJS plural, select, quoting and skeletons survive conversion', () => {
  const source =
    "'{literal}' {gender, select, female {{count, plural, one {# photo} other {# photos}}} other {none}} {price, number, ::currency/USD}";
  const catalogs = fromReactIntl({ complex: parse(source) }, { locale: 'en' });
  const i18n = createTranslator({ locales: catalogs });
  assert.equal(
    i18n.gt(msg('fallback', { id: 'complex' }), {
      gender: 'female',
      count: 2,
      price: 3,
    }),
    '{literal} 2 photos $3.00'
  );
});
