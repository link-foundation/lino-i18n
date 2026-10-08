import test from 'node:test';
import assert from 'node:assert/strict';
import * as intl from '../src/intl.js';
import { createTranslator } from '../src/messages.js';

function configuration() {
  return new intl.LocaleConfig({
    defaultLocale: 'english',
    locales: ['english', 'fr', 'canadian', 'sr-Cyrl'],
    aliases: { anglophone: 'english' },
    customMapping: {
      english: { code: 'en-US', name: 'English', emoji: '🇺🇸' },
      canadian: { code: 'fr-CA', name: 'Français canadien' },
      fr: 'Français',
    },
  });
}

test('custom locale identities negotiate canonical tags without mixing scripts', () => {
  const config = configuration();
  assert.equal(config.resolveCanonicalLocale('anglophone'), 'en-US');
  assert.equal(config.resolveAliasLocale('en_US'), 'english');
  assert.equal(config.determineLocale(['xx', 'fr-CA']), 'canadian');
  assert.equal(config.determineLocale('fr-FR'), 'fr');
  assert.equal(config.determineLocale('sr-Latn'), undefined);
  assert.equal(config.determineLocale('english'), 'english');
  assert.equal(config.isValidLocale('anglophone'), true);
  assert.equal(config.isValidLocale('broken!'), false);
  assert.equal(config.getLocaleName('english'), 'English');
  assert.equal(config.getLocaleName('fr'), 'Français');
  assert.equal(config.getLocaleEmoji('english'), '🇺🇸');
  assert.equal(config.getLocaleProperties('canadian').locale, 'fr-CA');
  assert.equal(config.isSupersetLocale('fr', 'canadian'), true);
  assert.equal(config.requiresTranslation('english', 'en-US'), false);
  assert.equal(config.requiresTranslation('canadian', 'english'), true);
  assert.equal(config.requiresTranslation('de', 'english'), false);
});

test('mapping cycles fail finitely and configuration snapshots do not share state', () => {
  assert.throws(
    () => new intl.LocaleConfig({ aliases: { a: 'b', b: 'a' } }),
    /cycle/i
  );
  assert.throws(
    () => new intl.LocaleConfig({ customMapping: { a: { code: 'a' } } }),
    /cycle/i
  );
  const input = { customMapping: { company: { code: 'de', name: 'German' } } };
  const config = new intl.LocaleConfig(input);
  input.customMapping.company.code = 'fr';
  const snapshot = config.snapshot();
  snapshot.customMapping.company.code = 'ja';
  assert.equal(config.resolveCanonicalLocale('company'), 'de');
});

test('configured formatting overrides and translator hydration preserve custom identities', () => {
  const config = configuration();
  assert.equal(
    createTranslator({ localeConfig: config }).getLocale(),
    'english'
  );
  assert.equal(config.formatCurrency(2, 'USD', 'english'), '$2.00');
  assert.equal(
    config.formatNum(1234.5, 'english', { locales: 'de' }),
    '1.234,5'
  );
  assert.equal(
    config.formatRelativeTimeFromDate('2026-01-02', 'english', {
      baseDate: '2026-01-01',
    }),
    'in 1 day'
  );
  const i18n = createTranslator({
    defaultLocale: 'english',
    localeConfig: config,
    locales: { english: { Hi: 'Hi' }, canadian: { Hi: 'Salut' } },
  });
  assert.equal(i18n.gt('{n, number}', { n: 1234.5 }), '1,234.5');
  i18n.setLocale('canadian');
  assert.equal(i18n.gt('Hi'), 'Salut');
  assert.equal(i18n.getFormatLocale(), 'fr-CA');
  const hydrated = createTranslator(
    JSON.parse(JSON.stringify(i18n.snapshot()))
  );
  assert.equal(hydrated.getLocale(), 'canadian');
  assert.equal(hydrated.getFormatLocale(), 'fr-CA');
  hydrated.setRegion('FR');
  assert.equal(hydrated.getFormatLocale(), 'fr-FR');
});

test('standalone superset and locale negotiation helpers match configured behavior', () => {
  assert.equal(intl.isSupersetLocale('zh-Hant', 'zh-Hant-TW'), true);
  assert.equal(intl.isSupersetLocale('zh-Hant', 'zh-Hans-CN'), false);
  assert.equal(intl.isSupersetLocale('fr-FR', 'fr'), false);
  assert.equal(intl.determineLocale(['de', 'en-GB'], ['fr', 'en']), 'en');
  assert.equal(intl.requiresTranslation('en-US', 'en'), false);
  assert.equal(intl.requiresTranslation('en-GB', 'en-US'), true);
});
