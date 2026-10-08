import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractMessages,
  validateCatalog,
  translateCatalog,
} from '../src/tooling.js';

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
