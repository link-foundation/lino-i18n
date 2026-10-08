import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, derive } from '../src/messages.js';
import { extractMessages } from '../src/tooling.js';
import { I18nProvider, T, Derive } from '../src/react.js';

test('finite derived functions, dictionaries and JSX use the same runtime identities', () => {
  const result =
    extractMessages(`import { createTranslator, derive } from 'lino-i18n/messages';
    import { T, Derive } from 'lino-i18n/react';
    const { gt } = createTranslator();
    function subject() { return gender ? 'Alice' : 'Brian'; }
    const labels = { save: 'Save', cancel: 'Cancel' };
    gt\`Hello \${derive(subject())}\`;
    gt('Click {action}', { action: derive(labels[action]) });
    const node = <T>Hello <Derive>{subject()}</Derive></T>;`);
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.messages.map((entry) => entry.source),
    [
      'Hello Alice',
      'Hello Brian',
      'Click Save',
      'Click Cancel',
      'Hello Alice',
      'Hello Brian',
    ]
  );
  const i18n = createTranslator({
    defaultLocale: 'fr',
    locales: {
      fr: { 'Hello Alice': 'Bonjour Alice', 'Click Save': 'Enregistrer' },
    },
  });
  assert.equal(i18n.gt`Hello ${derive('Alice')}`, 'Bonjour Alice');
  assert.equal(
    i18n.gt('Click {action}', { action: derive('Save') }),
    'Enregistrer'
  );
  assert.equal(
    renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { i18n },
        React.createElement(
          T,
          null,
          'Hello ',
          React.createElement(Derive, null, 'Alice')
        )
      )
    ),
    'Bonjour Alice'
  );
});

test('unsupported and cyclic derivations report diagnostics without executing code', () => {
  const result =
    extractMessages(`import { createTranslator, derive } from 'lino-i18n/messages';
    const { gt } = createTranslator();
    const loop = loop;
    gt\`Hello \${derive(loop)}\`;
    gt\`Hello \${derive(fetch('/execute'))}\`;`);
  assert.equal(result.messages.length, 0);
  assert.equal(result.diagnostics.length, 2);
  assert.match(result.diagnostics[0].message, /cycle|levels/);
});

test('derived source identities reject a stable id even for one variant', () => {
  const result =
    extractMessages(`import { createTranslator, derive } from 'lino-i18n/messages';
    const { gt } = createTranslator();
    gt('Hello {name}', { name: derive('Ada') }, { id: 'hello' });`);
  assert.equal(result.messages.length, 0);
  assert.match(result.diagnostics[0].message, /omit an explicit id/);
});

test('JSX derivation rejects stable ids consistently at extraction and rendering', () => {
  const result = extractMessages(`import { T, Derive } from 'lino-i18n/react';
    const node = <T id="hello">Hello <Derive>{'Ada'}</Derive></T>;`);
  assert.equal(result.messages.length, 0);
  assert.match(result.diagnostics[0].message, /omit an explicit id/);
  assert.throws(
    () =>
      renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { i18n: createTranslator() },
          React.createElement(
            T,
            { id: 'hello' },
            'Hello ',
            React.createElement(Derive, null, 'Ada')
          )
        )
      ),
    /omit an explicit id/
  );
});

test('derived boolean JSX values follow React empty-child rendering', () => {
  const result = extractMessages(`import { T, Derive } from 'lino-i18n/react';
    const node = <T>Hello <Derive>{condition ? 'Ada' : false}</Derive></T>;`);
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    ['Hello Ada', 'Hello ']
  );
});
