import test from 'node:test';
import assert from 'node:assert/strict';
import * as compiler from '../src/compiler.js';
import { extractMessages } from '../src/extract.js';

test('automatic JSX translation preserves rich content, attributes and source locations', () => {
  const code = `import { useGT } from 'lino-i18n/react';
    export function Page({ name }) {
      const gt = useGT();
      return <main><p>Hello <strong>{name}</strong>!</p>
        <input placeholder="Search" aria-label={\`Search for \${name}\`} />
      </main>;
    }`;
  const output = compiler.transformJSX(code, {
    file: 'page.tsx',
    attributeTranslator: 'gt',
    attributes: ['placeholder', 'aria-label'],
  });
  assert.equal(output.map.sources[0], 'page.tsx');
  assert.equal(output.map.sourcesContent[0], code);
  const manifest = extractMessages(output.code);
  assert.deepEqual(manifest.diagnostics, []);
  assert.deepEqual(
    manifest.messages.map(({ source }) => source).sort(),
    ['Hello <c0>{auto0}</c0>!', 'Search', 'Search for {v0}'].sort()
  );
  assert.match(output.code, /<strong>/);
  assert.match(output.code, /name="auto0"/);
});

test('compiler respects explicit T boundaries and diagnoses unavailable attribute translators', () => {
  const code = `import { T, Var } from 'lino-i18n/react';
    const app = <T>Hello <Var name="name">{name}</Var></T>;`;
  assert.deepEqual(
    extractMessages(compiler.transformJSX(code).code).messages.map(
      ({ source }) => source
    ),
    ['Hello {name}']
  );
  assert.throws(
    () =>
      compiler.transformJSX('<input placeholder="Search" />', {
        attributeTranslator: 'gt',
        attributes: ['placeholder'],
      }),
    /translator.*scope/i
  );
  const namespaced = `import { useGT } from 'lino-i18n/react'; import * as UI from './ui';
    function Page() { const gt = useGT(); return <UI.Button label="Save" />; }`;
  const output = compiler.transformJSX(namespaced, {
    attributeTranslator: 'gt',
    components: { 'UI.Button': ['label'] },
  });
  assert.deepEqual(
    extractMessages(output.code).messages.map(({ source }) => source),
    ['Save']
  );
});
