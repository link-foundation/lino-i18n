import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import * as adapters from '../src/react.js';

import { createI18n, createTranslator } from '../src/index.js';
import {
  I18nProvider,
  LocaleSelector,
  NumberFormat,
  Trans,
  useLocale,
  useTranslation,
  T,
  Var,
  Currency,
  CurrencyFormat,
} from '../src/react.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
test.afterEach(cleanup);
test.after(() => dom.window.close());

const h = React.createElement;

test('provider hooks react to locale changes and support key prefixes', async () => {
  const i18n = createI18n({
    locales: {
      en: { 'account.greeting': 'Hello, {{name}}!' },
      fr: { 'account.greeting': 'Bonjour, {{name}} !' },
    },
  });

  function Greeting() {
    const { t } = useTranslation('account');
    const locale = useLocale();
    return h('p', null, `${locale}: ${t('greeting', { name: 'Ada' })}`);
  }

  const root = render(h(I18nProvider, { i18n }, h(Greeting)));
  assert.equal(root.container.textContent, 'en: Hello, Ada!');

  await act(() => i18n.setLocale('fr'));
  assert.equal(root.container.textContent, 'fr: Bonjour, Ada !');
});

test('Trans, locale selector, and locale-aware format components compose', async () => {
  const i18n = createI18n({
    locales: {
      en: { total: '{{name}}, total: {{amount}}' },
      de: { total: '{{name}}, Summe: {{amount}}' },
    },
  });

  const root = render(
    h(
      I18nProvider,
      { i18n },
      h(Trans, {
        id: 'total',
        values: {
          name: 'Ada',
          amount: h(NumberFormat, {
            value: 1234.5,
            options: { minimumFractionDigits: 1 },
          }),
        },
      }),
      h(LocaleSelector)
    )
  );
  assert.equal(root.container.textContent, 'Ada, total: 1,234.5ende');

  const select = root.container.querySelector('select');
  fireEvent.change(select, { target: { value: 'de' } });
  assert.equal(root.container.textContent, 'Ada, Summe: 1.234,5ende');
  assert.equal(i18n.getLocale(), 'de');
});

test('hooks fail clearly outside I18nProvider', () => {
  function Invalid() {
    useLocale();
    return null;
  }

  assert.throws(
    () => renderToString(h(Invalid)),
    /must be used inside an I18nProvider/
  );
});

test('currency children, locale overrides and legacy values format correctly', async () => {
  const i18n = createTranslator({ defaultLocale: 'fr', region: 'CA' });
  const root = render(
    h(
      I18nProvider,
      { i18n },
      h(Currency, { currency: 'USD', locale: 'en-US' }, 2),
      ' / ',
      h(CurrencyFormat, { currency: 'USD', value: 0 })
    )
  );
  const expected = (locale) =>
    `$2.00 / ${new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
    }).format(0)}`;
  assert.equal(root.container.textContent, expected('fr-CA'));
  await act(() => i18n.setRegion('GB'));
  assert.equal(root.container.textContent, expected('fr-GB'));
});

test('source-message snapshots hydrate and receive catalog and region updates', async () => {
  const server = createTranslator({
    defaultLocale: 'fr',
    locales: { fr: { Hi: 'Salut {name}' } },
  });
  const client = createTranslator(
    JSON.parse(JSON.stringify(server.snapshot()))
  );
  function App({ i18n }) {
    return h(
      I18nProvider,
      { i18n },
      h(T, { id: 'Hi' }, 'Hello ', h(Var, { name: 'name' }, 'Ada')),
      ' ',
      h(Currency, { currency: 'USD' }, 2)
    );
  }
  const container = globalThis.document.createElement('div');
  container.innerHTML = renderToString(h(App, { i18n: server }));
  const errors = [];
  let root;
  try {
    await act(async () => {
      root = hydrateRoot(container, h(App, { i18n: client }), {
        onRecoverableError: (error) => errors.push(error),
      });
    });
    assert.equal(container.textContent.startsWith('Salut Ada'), true);
    await act(() => {
      client.addLocale('fr', { Hi: 'Bonjour {name}' });
      client.setRegion('CA');
    });
    assert.equal(container.textContent.startsWith('Bonjour Ada'), true);
    assert.deepEqual(errors, []);
    assert.equal(server.gt('Hi', { name: 'Ada' }), 'Salut Ada');
  } finally {
    await act(() => root?.unmount());
  }
});

test('relative-date, relative-time and list formats honor deterministic time and locale overrides', async () => {
  const i18n = createTranslator({ defaultLocale: 'fr' });
  const root = render(
    h(
      I18nProvider,
      { i18n },
      h(
        adapters.RelativeDate,
        { now: '2026-01-01', locale: 'en' },
        '2026-01-02'
      ),
      ' / ',
      h(adapters.RelativeTime, { unit: 'day', locale: 'en' }, 0),
      ' / ',
      h(adapters.ListFormat, { values: ['Ada', 'Lin'], locale: 'en' })
    )
  );
  assert.equal(
    root.container.textContent,
    'in 1 day / in 0 days / Ada and Lin'
  );
  await act(() => i18n.setLocale('de'));
  assert.equal(
    root.container.textContent,
    'in 1 day / in 0 days / Ada and Lin'
  );
  assert.throws(
    () =>
      renderToString(
        h(
          I18nProvider,
          { i18n },
          h(adapters.RelativeDate, { value: '2026-01-02' })
        )
      ),
    /explicit now/
  );
});

test('React source, plural and locale metadata support custom catalog identities', () => {
  const i18n = createTranslator({
    defaultLocale: 'company',
    localeConfig: {
      customMapping: { company: { code: 'ar', name: 'Company Arabic' } },
    },
  });
  function Metadata() {
    return `${adapters.useLocaleDirection()}: ${adapters.useLocaleProperties().name}`;
  }
  const markup = renderToString(
    h(
      I18nProvider,
      { i18n },
      h(Metadata),
      h(T, { source: '{n, number}', values: { n: 2 } }),
      h(adapters.Plural, { count: 2, two: 'pair', other: 'items' })
    )
  );
  assert.match(markup, /rtl: Company Arabic/);
  assert.match(markup, /pair/);
});

test('dictionary hooks expose array subtrees and update after locale switches', async () => {
  const i18n = createTranslator({
    dictionary: { actions: ['Save', 'Cancel'] },
    locales: { fr: { 'actions.0': 'Enregistrer' } },
  });
  function Actions() {
    return adapters.useTranslations('actions').obj().join(' / ');
  }
  const root = render(h(I18nProvider, { i18n }, h(Actions)));
  assert.equal(root.container.textContent, 'Save / Cancel');
  await act(() => i18n.setLocale('fr'));
  assert.equal(root.container.textContent, 'Enregistrer / Cancel');
});
