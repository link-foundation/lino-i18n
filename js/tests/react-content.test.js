import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator } from '../src/messages.js';
import { I18nProvider, T, Var, Plural, Branch } from '../src/react.js';

const h = React.createElement;
const render = (i18n, node) =>
  renderToStaticMarkup(h(I18nProvider, { i18n }, node));

test('T translates and reorders nested JSX while retaining code-owned props', () => {
  const i18n = createTranslator({
    defaultLocale: 'fr',
    locales: { fr: { welcome: '<c0>Bonjour {name}</c0>, bienvenue !' } },
  });
  const node = h(
    T,
    { id: 'welcome' },
    'Welcome, ',
    h(
      'strong',
      { className: 'name' },
      'hello ',
      h(Var, { name: 'name' }, 'Ada')
    )
  );
  assert.equal(
    render(i18n, node),
    '<strong class="name">Bonjour Ada</strong>, bienvenue !'
  );
  i18n.addLocale('fr', { welcome: '<script>alert(1)</script>' });
  assert.throws(() => render(i18n, node), /script/);
});

test('T keeps variable and custom component output opaque and escapes text', () => {
  const i18n = createTranslator();
  const node = h(
    T,
    null,
    'Hello ',
    h(Var, { name: 'name' }, '<img onerror=alert(1)>'),
    ' ',
    h('a', { href: '/safe' }, 'read more')
  );
  assert.equal(
    render(i18n, node),
    'Hello &lt;img onerror=alert(1)&gt; <a href="/safe">read more</a>'
  );
});

test('CLDR plural and arbitrary branches preserve selected React content', () => {
  const i18n = createTranslator({ defaultLocale: 'ru' });
  assert.equal(
    render(
      i18n,
      h(Plural, {
        count: 2,
        one: 'one',
        few: h('b', null, 'few'),
        other: 'other',
      })
    ),
    '<b>few</b>'
  );
  assert.equal(
    render(
      i18n,
      h(Branch, { value: 'female', cases: { female: 'She', other: 'They' } })
    ),
    'She'
  );
});

test('T serializes every branch so translations can change grammatical order', () => {
  const i18n = createTranslator({
    defaultLocale: 'fr',
    locales: {
      fr: {
        cart: '{n0, plural, one {Un article pour {name}} other {# articles pour {name}}}',
      },
    },
  });
  const node = h(
    T,
    { id: 'cart' },
    h(Var, { name: 'name' }, 'Ada'),
    ': ',
    h(Plural, { count: 2, one: 'one item', other: 'many items' })
  );
  assert.equal(render(i18n, node), '2 articles pour Ada');
});
