import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';

import { createI18n } from '../src/index.js';
import {
  I18nProvider,
  LocaleSelector,
  NumberFormat,
  Trans,
  useLocale,
  useTranslation,
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
