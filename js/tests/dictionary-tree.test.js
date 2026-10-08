import test from 'node:test';
import assert from 'node:assert/strict';
import * as messages from '../src/messages.js';

test('dictionary schemas preserve nested arrays, objects and ICU source fallbacks', () => {
  const schema = {
    actions: ['Save', 'Cancel'],
    cards: [{ title: 'Hello {name}', labels: ['First', 'Second'] }],
    numericObject: { 0: 'Zero', 1: 'One' },
  };
  const i18n = messages.createDictionaryTranslator(schema, {
    defaultLocale: 'fr',
    locales: {
      fr: { 'actions.0': 'Enregistrer', 'cards.0.title': 'Bonjour {name}' },
    },
  });
  assert.deepEqual(i18n.dictionaryTree('', { name: 'Ada' }), {
    actions: ['Enregistrer', 'Cancel'],
    cards: [{ title: 'Bonjour Ada', labels: ['First', 'Second'] }],
    numericObject: { 0: 'Zero', 1: 'One' },
  });
  assert.deepEqual(i18n.dictionaryTree('actions'), ['Enregistrer', 'Cancel']);
  assert.equal(
    i18n.dictionaryTree('cards.0.title', { name: 'Ada' }),
    'Bonjour Ada'
  );
  i18n.setLocale('en');
  assert.deepEqual(i18n.dictionaryTree('actions'), ['Save', 'Cancel']);
  // Legacy dotted-tree output retains its original object representation.
  assert.deepEqual(i18n.dictionaryObject('actions'), {
    0: 'Save',
    1: 'Cancel',
  });
});

test('dictionary schemas and snapshots are copied, safe for prototype keys and bounded', () => {
  const schema = JSON.parse(
    '{"__proto__":{"name":"Safe"},"constructor":["Build"]}'
  );
  const definition = messages.defineDictionary(schema);
  schema.constructor[0] = 'Changed';
  assert.equal(definition.constructor[0], 'Build');
  assert.equal(Object.isFrozen(definition.constructor), true);
  const i18n = messages.createDictionaryTranslator(definition);
  const snapshot = JSON.parse(JSON.stringify(i18n.snapshot()));
  const hydrated = messages.createTranslator(snapshot);
  assert.deepEqual(hydrated.dictionaryTree(), definition);
  assert.equal(Object.hasOwn(hydrated.dictionaryTree(), '__proto__'), true);
  assert.equal({}.name, undefined);
  assert.throws(() => hydrated.dictionaryTree('missing'), /Unknown dictionary/);
  assert.throws(
    () => messages.defineDictionary({ 'a.b': 'Ambiguous' }),
    /dictionary key/
  );
  const cycle = {};
  cycle.self = cycle;
  assert.throws(() => messages.defineDictionary(cycle), /cycle/);
  const sparse = ['First', 'Second'];
  delete sparse[0];
  assert.throws(() => messages.defineDictionary({ values: sparse }), /sparse/);
  let deep = { leaf: 'Finite' };
  for (let level = 0; level < 22; level += 1) {
    deep = { child: deep };
  }
  assert.throws(() => messages.defineDictionary(deep), /depth/);
});
