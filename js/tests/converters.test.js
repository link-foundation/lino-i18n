import test from 'node:test';
import assert from 'node:assert/strict';

import { fromI18next, fromI18nJs, fromReactIntl } from '../src/index.js';

test('fromI18next flattens nested keys with dot separator', () => {
  const result = fromI18next({
    en: {
      greeting: 'Hello, {{name}}',
      cart: { title: 'Your cart', items_one: '{{count}} item' },
    },
  });
  assert.deepEqual(result, {
    en: {
      greeting: 'Hello, {{name}}',
      'cart.title': 'Your cart',
      'cart.items_one': '{{count}} item',
    },
  });
});

test('fromI18next supports namespace shape with `ns:` prefix', () => {
  const result = fromI18next({
    en: {
      common: { ok: 'OK', cancel: 'Cancel' },
      cart: { title: 'Your cart' },
    },
  });
  assert.deepEqual(result, {
    en: {
      'common:ok': 'OK',
      'common:cancel': 'Cancel',
      'cart:title': 'Your cart',
    },
  });
});

test('fromI18next defaults to provided locale when input is a single catalogue', () => {
  const result = fromI18next(
    { hi: 'Hello', cart: { title: 'Your cart' } },
    { locale: 'fr' }
  );
  assert.deepEqual(result, {
    fr: {
      hi: 'Hello',
      'cart.title': 'Your cart',
    },
  });
});

test('fromI18nJs rewrites %{var} into {{var}}', () => {
  const result = fromI18nJs({
    en: {
      greeting: 'Hello, %{name}',
      cart: { items: 'You have %{count} items' },
    },
  });
  assert.deepEqual(result, {
    en: {
      greeting: 'Hello, {{name}}',
      'cart.items': 'You have {{count}} items',
    },
  });
});

test('fromReactIntl handles plain ICU strings', () => {
  const result = fromReactIntl(
    {
      greeting: 'Hello, {name}',
      'cart.title': 'Your cart',
    },
    { locale: 'en' }
  );
  assert.deepEqual(result, {
    en: {
      greeting: 'Hello, {name}',
      'cart.title': 'Your cart',
    },
  });
});

test('fromReactIntl extracts defaultMessage', () => {
  const result = fromReactIntl(
    {
      'cart.title': { defaultMessage: 'Your cart', description: 'header' },
    },
    { locale: 'en' }
  );
  assert.deepEqual(result, {
    en: { 'cart.title': 'Your cart' },
  });
});

test('fromReactIntl decompiles compiled AST nodes', () => {
  const result = fromReactIntl(
    {
      greeting: [
        { type: 0, value: 'Hello, ' },
        { type: 1, value: 'name' },
        { type: 0, value: '!' },
      ],
    },
    { locale: 'en' }
  );
  assert.deepEqual(result, {
    en: { greeting: 'Hello, {name}!' },
  });
});
