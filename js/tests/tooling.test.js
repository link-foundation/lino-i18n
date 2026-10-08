import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractMessages,
  validateCatalog,
  translateCatalog,
  diffMessages,
} from '../src/tooling.js';

test('extraction follows scoped Node helpers and asynchronous server factories', () => {
  const result = extractMessages(`
    import { gt, getGT, getMessages } from 'lino-i18n/node';
    import { createRequestTranslator } from 'lino-i18n/server';
    import { createDictionaryTranslator } from 'lino-i18n/messages';
    gt('Scoped');
    const scoped = getGT(); scoped('Helper');
    const messages = getMessages(); messages\`Hi \${name}\`;
    const request = await createRequestTranslator(req); request.gt('Server');
    const dictionary = createDictionaryTranslator({}); dictionary.gt('Schema');
    function unrelated(gt, getGT) { gt('Ignore'); const other = getGT(); other('Ignore'); }
  `);
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    ['Scoped', 'Helper', 'Hi {v0}', 'Server', 'Schema']
  );
});

test('dictionary schemas extract array paths and diagnose dynamic or cyclic declarations', () => {
  const result = extractMessages(`
    import { defineDictionary, createDictionaryTranslator, createTranslator } from 'lino-i18n/messages';
    const schema = defineDictionary({ page: { title: 'Welcome', buttons: ['Save', 'Cancel'] } } as const);
    const i18n = createDictionaryTranslator(schema);
    const other = createTranslator({ dictionary: { item: '{n, number} items' } });
  `);
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.messages.map(({ id, source }) => [id, source]),
    [
      ['page.title', 'Welcome'],
      ['page.buttons.0', 'Save'],
      ['page.buttons.1', 'Cancel'],
      ['item', '{n, number} items'],
    ]
  );
  for (const source of [
    `const schema = { title: value }; defineDictionary(schema);`,
    `const schema = { nested: schema }; defineDictionary(schema);`,
    `defineDictionary({ ...schema });`,
    `defineDictionary({ 'bad.key': 'Invalid' });`,
    `defineDictionary({ __proto__: 'Invalid' });`,
    `defineDictionary(['Save', , 'Cancel']);`,
  ]) {
    const invalid = extractMessages(
      `import { defineDictionary } from 'lino-i18n/messages'; ${source}`
    );
    assert.equal(invalid.diagnostics.length, 1, source);
  }
});

test('message aliases and non-rendered JSX children retain runtime identities', () => {
  const result =
    extractMessages(`import { createTranslator } from 'lino-i18n/messages';
    import { T } from 'lino-i18n/react';
    const { m } = createTranslator();
    m\`Hello \${name}\`;
    const node = <T>{false}Hello <b>{/* empty */}</b></T>;`);
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    ['Hello {v0}', 'Hello {c0}']
  );
});

test('AST extraction follows import aliases and ignores comments and shadowed calls', () => {
  const code = `
    import { msg as message, createTranslator } from 'lino-i18n/messages';
    const i18n = createTranslator();
    // message('do not extract');
    const deferred = message('Hello {name}', { id: 'hello', description: 'Greeting' });
    i18n.gt('Save');
    i18n.gt\`Hello \${name}\`;
    function unrelated(message) { return message('not ours'); }
  `;
  const result = extractMessages(code, { file: 'app.ts' });
  assert.deepEqual(
    result.messages.map((entry) => entry.id),
    ['hello', 'Save', 'Hello {v0}']
  );
  assert.equal(result.messages[0].description, 'Greeting');
  assert.equal(result.messages[0].file, 'app.ts');
  assert.deepEqual(result.messages[0].variables, ['name']);
  assert.equal(result.diagnostics.length, 0);
});

test('JSX extraction uses the same structural IDs as runtime content', () => {
  const result = extractMessages(
    `import { T, Var } from 'lino-i18n/react';
    const node = <T id="hello">Hello <strong><Var name="name">{name}</Var></strong></T>;`,
    { file: 'app.tsx' }
  );
  assert.equal(result.messages[0].source, 'Hello <c0>{name}</c0>');
  const dynamic = extractMessages(
    `import { msg } from 'lino-i18n/messages'; msg(variable);`
  );
  assert.equal(dynamic.diagnostics.length, 1);
});

test('descriptor arrays and inline uses extract once and templates escape literals', () => {
  const result = extractMessages(
    `import { createTranslator, msg } from 'lino-i18n/messages'; const { gt, m } = createTranslator(); gt(msg('Save')); m('Cancel'); msg(['Yes', 'No'], { id: 'answers' }); gt\`{literal} \${name}\`;`
  );
  assert.deepEqual(
    result.messages.map((entry) => entry.id),
    ['Save', 'Cancel', 'answers.0', 'answers.1', "'{'literal'}' {v0}"]
  );
  assert.deepEqual(result.diagnostics, []);
  assert.equal(
    extractMessages(
      `import { T } from 'lino-i18n/react'; <T {...props}>Hello</T>`
    ).diagnostics.length,
    1
  );
});

test('catalog validation reports missing, unused, invalid ICU and placeholder drift', () => {
  const messages = extractMessages(
    `import { msg } from 'lino-i18n/messages'; msg('Hello {name}', { id: 'hello' });`
  ).messages;
  assert.deepEqual(validateCatalog(messages, { hello: 'Bonjour {name}' }), []);
  assert.equal(
    validateCatalog(messages, { hello: 'Bonjour {person}' })[0].type,
    'variables'
  );
  assert.equal(
    validateCatalog(messages, { hello: '{n, plural, one {one}}' })[0].type,
    'syntax'
  );
  assert.deepEqual(
    validateCatalog(messages, { extra: 'unused' }).map((entry) => entry.type),
    ['missing', 'unused']
  );
});

test('changed stable IDs require review even when placeholders still match', () => {
  const before = [
    { id: 'hello', source: 'Hi {name}' },
    { id: 'old', source: 'Old' },
  ];
  const after = [
    { id: 'hello', source: 'Welcome {name}' },
    { id: 'new', source: 'New' },
  ];
  assert.deepEqual(diffMessages(before, after), {
    added: ['new'],
    changed: ['hello'],
    removed: ['old'],
  });
  assert.equal(
    validateCatalog(
      after,
      { hello: 'Salut {name}', new: 'Nouveau' },
      { previousMessages: before }
    )[0].type,
    'stale'
  );
});

test('translation providers produce validated incremental candidates without overwriting approved text', async () => {
  const messages = [
    { id: 'hello', source: 'Hello {name}' },
    { id: 'save', source: 'Save' },
  ];
  const calls = [];
  const provider = async (batch, options) => {
    calls.push(options.locale);
    return Object.fromEntries(
      batch.map((entry) => [entry.id, 'Bonjour {name}'])
    );
  };
  const result = await translateCatalog(
    messages,
    { save: 'Enregistrer' },
    { locale: 'fr', provider }
  );
  assert.deepEqual(result.translations, {
    hello: 'Bonjour {name}',
    save: 'Enregistrer',
  });
  assert.deepEqual(calls, ['fr']);
  await assert.rejects(
    translateCatalog(
      messages,
      {},
      {
        locale: 'fr',
        provider: async () => ({ hello: 'broken', save: 'Enregistrer' }),
      }
    ),
    /variables/
  );
});
