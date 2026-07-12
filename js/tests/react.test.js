import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

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

const h = React.createElement;

function renderedText(node) {
  if (typeof node === 'string') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(renderedText).join('');
  }
  return renderedText(node?.children || []);
}

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

  let root;
  await act(() => {
    root = TestRenderer.create(h(I18nProvider, { i18n }, h(Greeting)));
  });
  assert.equal(root.toJSON().children[0], 'en: Hello, Ada!');

  await act(() => i18n.setLocale('fr'));
  assert.equal(root.toJSON().children[0], 'fr: Bonjour, Ada !');
});

test('Trans, locale selector, and locale-aware format components compose', async () => {
  const i18n = createI18n({
    locales: {
      en: { total: 'Total: {{amount}}' },
      de: { total: 'Summe: {{amount}}' },
    },
  });

  let root;
  await act(() => {
    root = TestRenderer.create(
      h(
        I18nProvider,
        { i18n },
        h(Trans, {
          id: 'total',
          values: {
            amount: h(NumberFormat, {
              value: 1234.5,
              options: { minimumFractionDigits: 1 },
            }),
          },
        }),
        h(LocaleSelector)
      )
    );
  });
  assert.equal(renderedText(root.toJSON()), 'Total: 1,234.5ende');

  const select = root.root.findByType('select');
  await act(() => select.props.onChange({ target: { value: 'de' } }));
  assert.equal(renderedText(root.toJSON()), 'Summe: 1.234,5ende');
  assert.equal(i18n.getLocale(), 'de');
});

test('hooks fail clearly outside I18nProvider', async () => {
  function Invalid() {
    useLocale();
    return null;
  }

  assert.throws(
    () => act(() => TestRenderer.create(h(Invalid))),
    /must be used inside an I18nProvider/
  );
});
