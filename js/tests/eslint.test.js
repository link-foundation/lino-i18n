import test from 'node:test';
import assert from 'node:assert/strict';
import { Linter } from 'eslint';
import { Linter as Linter9 } from 'eslint9';
import babelParser from '@babel/eslint-parser';
import plugin from '../src/eslint.js';

function lint(code, rules, options) {
  return new Linter().verify(
    code,
    [
      {
        ...plugin.configs.recommended,
        languageOptions: {
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        ...(rules && { rules }),
      },
    ],
    options
  );
}

test('lint source calls by import identity, including aliases, namespaces and factories', () => {
  const diagnostics = lint(`
    import { msg as message, createTranslator } from 'lino-i18n/messages';
    import * as messages from 'lino-i18n/messages';
    const { gt } = createTranslator();
    message(dynamic); messages.msg('Hi ' + name); gt('{broken');
    function ignored(message, gt) { message(dynamic); gt(dynamic); }
  `);
  assert.equal(diagnostics.length, 3);
  assert.ok(
    diagnostics.every(({ ruleId }) => ruleId === 'lino-i18n/static-string')
  );
  assert.match(diagnostics[0].message, /static/);
  assert.match(diagnostics[2].message, /MALFORMED|EXPECT|argument/i);
});

test('valid descriptors, explicit variables and finite derivation pass all rules', () => {
  const diagnostics = lint(`
    import { msg, createTranslator, derive } from 'lino-i18n/messages';
    import { T, Var, Branch } from 'lino-i18n/react';
    const gt = createTranslator().gt;
    const label = msg(['Save', 'Cancel']); gt(label);
    gt('Hello {name}', {name}); gt\`Hello \${name}\`;
    gt('{word}', {word: derive(on ? 'On' : 'Off')});
    const element = <T>Hello <Var name="name">{name}</Var>
      <Branch name="kind" value={kind} cases={{yes: 'Yes', other: 'No'}} />
    </T>;
  `);
  assert.deepEqual(diagnostics, []);
});

test('JSX lint reports static source errors without confusing unrelated or shadowed components', () => {
  const diagnostics = lint(`
    import { T as Translate } from 'lino-i18n/react';
    const element = <Translate>Hello {name}</Translate>;
    function ignored(Translate) { return <Translate>{name}</Translate>; }
    const plain = <Other>{name}</Other>;
  `);
  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0].ruleId, 'lino-i18n/static-jsx');
  assert.match(diagnostics[0].message, /Var/);
});

test('headless Branch data attributes are diagnosed by binding identity', () => {
  const diagnostics = lint(`
    import { Branch as Choice } from 'lino-i18n/react';
    import * as R from 'lino-i18n/react';
    const element = <Choice data-testid="gone" />;
    const other = <R.Branch data-foo="gone" />;
    function ignored(Choice) { return <Choice data-testid="kept" />; }
  `);
  assert.equal(diagnostics.length, 2);
  assert.ok(
    diagnostics.every(({ ruleId }) =>
      ruleId.endsWith('/no-data-attrs-on-branch')
    )
  );
});

test('simple JSX variable suggestions add a collision-free import and produce extractable JSX', () => {
  for (const header of [
    `import { T, Var as Value } from 'lino-i18n/react';`,
    `import { T } from 'lino-i18n/react'; const LinoVar = 'existing';`,
    `'use client'; import { T } from 'lino-i18n/react';`,
    `import { T } from 'lino-i18n/react'; void LinoVar;`,
  ]) {
    const code = `${header}\nconst element = <T>Hello {name}</T>;`;
    const [diagnostic] = lint(code);
    assert.equal(diagnostic.suggestions.length, 1);
    const { range, text } = diagnostic.suggestions[0].fix;
    const fixed = code.slice(0, range[0]) + text + code.slice(range[1]);
    assert.deepEqual(lint(fixed), []);
    assert.match(fixed, /name="name"/);
    assert.equal((fixed.match(/\{name\}/g) || []).length, 1);
    assert.equal(
      lint(code).length,
      1,
      'suggestions do not apply automatically'
    );
    if (header.startsWith("'use client'")) {
      assert.ok(fixed.startsWith("'use client';"));
    }
    if (header.includes('void LinoVar')) {
      assert.match(fixed, /Var as LinoVar1/);
    }
  }
});

test('lint budgets diagnose finite input without executing application code', () => {
  const code = `import { msg } from 'lino-i18n/messages'; msg('Safe');`;
  const diagnostics = lint(code, {
    'lino-i18n/static-string': ['error', { maxBytes: 10 }],
    'lino-i18n/static-jsx': 'off',
    'lino-i18n/no-data-attrs-on-branch': 'off',
  });
  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /bytes/);
  const deep = `const nested = ${'['.repeat(20)}0${']'.repeat(20)};`;
  assert.match(
    lint(deep, { 'lino-i18n/static-string': ['error', { maxDepth: 10 }] })[0]
      .message,
    /depth/
  );
  assert.deepEqual(
    lint(`import { msg } from 'other-library'; msg(dynamic);`),
    []
  );
});

test('the recommended flat config runs in actual ESLint 9 and 10', () => {
  for (const RuntimeLinter of [Linter9, Linter]) {
    const diagnostics = new RuntimeLinter().verify(
      `import { msg } from 'lino-i18n/messages'; msg(dynamic);`,
      [plugin.configs.recommended]
    );
    assert.equal(diagnostics.length, 1);
    assert.equal(diagnostics[0].ruleId, 'lino-i18n/static-string');
  }
});

test('TypeScript and TSX use the configured actual Babel ESLint parser', () => {
  const diagnostics = new Linter().verify(
    `import { msg } from 'lino-i18n/messages';
     import { T } from 'lino-i18n/react';
     import type { Var } from 'lino-i18n/react';
     const name: string = 'Ada';
     const descriptor = msg(name);
     const node = <T>Hello {name}</T>;`,
    [
      {
        ...plugin.configs.recommended,
        languageOptions: {
          parser: babelParser,
          parserOptions: {
            requireConfigFile: false,
            babelOptions: {
              babelrc: false,
              configFile: false,
              parserOpts: { plugins: ['typescript', 'jsx'] },
            },
          },
        },
      },
    ]
  );
  assert.deepEqual(
    diagnostics.map(({ ruleId }) => ruleId),
    ['lino-i18n/static-string', 'lino-i18n/static-jsx'],
    JSON.stringify(diagnostics)
  );
  assert.match(
    diagnostics[1].suggestions[0].fix.text,
    /import \{ Var as LinoVar \}/
  );
});
