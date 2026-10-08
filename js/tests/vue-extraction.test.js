import { test } from 'test-anywhere';
import assert from 'node:assert/strict';
import { extractVueMessages, extractVueProject } from '../src/vue-extract.js';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { compileScript, parse } from '@vue/compiler-sfc';
import { createVueI18n } from '../src/vue.js';

const source = `<script setup>
import { T as Text, Var, Plural as Count, useGT } from 'lino-i18n/vue';
const gt = useGT();
const name = 'Ada';
const label = gt('Ready');
</script>
<template>
  <Text description="Greeting">Hello <strong><Var name="name">{{ name }}</Var></strong>!</Text>
  <p>{{ gt('Template message') }}</p>
  <Text><Count :count="2" name="n"><template #one>one</template><template #other># items</template></Count></Text>
</template>`;

test('Vue SFC extraction matches an actual compiler and SSR source identity', async () => {
  const result = extractVueMessages(source, { file: 'Greeting.vue' });
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    [
      'Ready',
      'Hello <c0>{name}</c0>!',
      'Template message',
      '{n, plural, one {one} other {# items}}',
    ]
  );
  assert.equal(result.messages[2].line, 9);
  const script = compileScript(parse(source).descriptor, {
    id: 'fixture',
    inlineTemplate: true,
  });
  // Import the actual compiler output; only this test fixture is evaluated.
  const code = script.content.replaceAll(
    "'lino-i18n/vue'",
    JSON.stringify(new URL('../src/vue.js', import.meta.url).href)
  );
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { pathToFileURL } = await import('node:url');
  const directory = await mkdtemp(`${tmpdir()}/lino-vue-`);
  const file = `${directory}/component.mjs`;
  try {
    // Resolve Vue through the installed package rather than the OS temp path.
    const compiled = code.replaceAll(
      'from "vue"',
      `from ${JSON.stringify(import.meta.resolve('vue'))}`
    );
    await writeFile(file, compiled);
    const component = (await import(pathToFileURL(file).href)).default;
    const plugin = createVueI18n({
      defaultLocale: 'fr',
      locales: { fr: { [result.messages[1].id]: 'Bonjour <c0>{name}</c0> !' } },
    });
    const html = await renderToString(createSSRApp(component).use(plugin));
    assert.match(
      html.replaceAll(/<!--.*?-->/g, ''),
      /Bonjour <strong>Ada<\/strong> !/
    );
    assert.match(html, /2 items/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Vue template aliases, loops and slot bindings respect translation scope', () => {
  const result = extractVueMessages(`<script setup>
import { T, Var } from 'lino-i18n/vue';
const items = [];
</script><template>
<T v-for="item in items">Item <Var name="name">{{item}}</Var></T>
<div v-for="T in items"><T>Shadowed</T></div>
<Component v-slot="{ T }"><T>Slot shadowed</T></Component>
</template>`);
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    ['Item {name}']
  );
  assert.deepEqual(result.diagnostics, []);
});

test('Vue extraction diagnoses dynamic identity, unsupported syntax and source bounds', () => {
  const result =
    extractVueMessages(`<script setup>import { T } from 'lino-i18n/vue'; const name='Ada';</script>
<template><T>Hello {{ name }}</T><T>Items <strong v-for="item in items">{{item}}</strong></T></template>`);
  assert.equal(result.messages.length, 0);
  assert.equal(result.diagnostics.length, 2);
  assert.match(result.diagnostics[0].message, /Var/);
  assert.throws(() => extractVueMessages(source, { maxBytes: 1 }), /limit/);
  assert.throws(
    () => extractVueMessages('<script setup>let =</script>'),
    /Unexpected/
  );
});

test('Vue extraction retains UTF-16 source offsets and bounds template depth', () => {
  const result = extractVueMessages(
    "<template><span>😀</span><T>Hello</T></template><script setup>import {T} from 'lino-i18n/vue';</script>"
  );
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    ['Hello']
  );
  assert.throws(
    () =>
      extractVueMessages(
        `<template>${'<div>'.repeat(150)}x${'</div>'.repeat(150)}</template>`
      ),
    /depth limit/
  );
});

test('Vue v-pre native tags do not become imported translation components', () => {
  const result = extractVueMessages(
    `<script setup>import { T } from 'lino-i18n/vue';</script><template><div v-pre><T>Literal {{ braces }}</T></div><T>Real</T></template>`
  );
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    ['Real']
  );
});

test('Vue project extraction resolves imported source functions and preserves source locations', () => {
  const result = extractVueProject({
    'i18n.ts': `import {createTranslator} from 'lino-i18n/messages'; export const {gt}=createTranslator();`,
    'App.vue': `<script setup>import {T,Var} from 'lino-i18n/vue'; import {gt} from './i18n.js'; const label=gt('Ready');</script>\n<template><T>Hello <Var name="name" :value="label"/></T></template>`,
  });
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    ['Hello {name}', 'Ready']
  );
  assert.equal(result.messages[0].line, 2);
});

test('Vue project aliases diagnose conditional content while extracting independent conditional messages', () => {
  const result = extractVueProject({
    'i18n.js': `export {T as Text} from 'lino-i18n/vue';`,
    'App.vue': `<script setup>import {Text} from './i18n.js'; const shown=false;</script><template><Text>Hi <strong v-if="shown">there</strong></Text><Text v-if="shown">Independent</Text></template>`,
  });
  assert.deepEqual(
    result.messages.map(({ source }) => source),
    ['Independent']
  );
  assert.equal(result.diagnostics.length, 1);
});

test('Vue CLI extraction uses the optional SFC parser and preserves .lino output', async () => {
  const { mkdtemp, writeFile, readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { commandExtract } = await import('../src/tooling-files.js');
  const directory = await mkdtemp(`${tmpdir()}/lino-vue-cli-`);
  try {
    await writeFile(`${directory}/App.vue`, source);
    const code = await commandExtract(
      { in: directory, out: `${directory}/out`, syntax: 'vue' },
      () => {},
      (message) => assert.fail(message)
    );
    assert.equal(code, 0);
    const manifest = JSON.parse(
      await readFile(`${directory}/out/messages.json`, 'utf8')
    );
    assert.equal(manifest.messages.length, 4);
    assert.match(await readFile(`${directory}/out/en.lino`, 'utf8'), /Hello/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
