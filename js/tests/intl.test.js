import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrency,
  formatCutoff,
  formatListToParts,
  formatRelativeTimeFromDate,
  getLocaleDirection,
  getLocaleEmoji,
  isSameLanguage,
  isSameDialect,
  isValidLocale,
  resolveCanonicalLocale,
} from '../src/intl.js';

test('locale helpers canonicalize dialects, scripts and direction', () => {
  assert.equal(resolveCanonicalLocale('en_US'), 'en-US');
  assert.equal(isValidLocale('not_a_locale_!'), false);
  assert.equal(isSameLanguage('fr-CA', 'fr-FR'), true);
  assert.equal(isSameDialect('en', 'en-US'), true);
  assert.equal(isSameDialect('en-US', 'en-GB'), false);
  assert.equal(getLocaleDirection('ar'), 'rtl');
  assert.equal(getLocaleDirection('az-Latn'), 'ltr');
  assert.equal(getLocaleEmoji('fr-FR'), '🇫🇷');
});

test('format helpers preserve graphemes, list parts and deterministic relative time', () => {
  assert.equal(formatCutoff('👩🏽‍💻 café', 1), '👩🏽‍💻…');
  assert.throws(() => formatCutoff('text', -1), /length/);
  assert.equal(formatCurrency(2, 'USD', 'en-US'), '$2.00');
  assert.equal(
    formatListToParts(['a', 'b'], 'en').filter(
      (part) => part.type === 'element'
    ).length,
    2
  );
  assert.equal(
    formatRelativeTimeFromDate(
      '2026-01-02T00:00:00Z',
      '2026-01-01T00:00:00Z',
      'en'
    ),
    'in 1 day'
  );
});
