import assert from 'node:assert/strict';
import { test } from 'test-anywhere';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkMdx from 'remark-mdx';
import escapeHtml, {
  escapeHtmlInTextNodes,
  escapeMarkdownInMdxJsxTextNodes,
  escapeMarkdownInMdxJsxText,
  remarkGfmCustom,
  normalizeCJKCharacters,
  preserveEscapedEntities,
} from '../src/remark.js';
import {
  getGTSupportedLocale,
  listGTSupportedLocales,
} from '../src/providers/gt-locales.js';

function text(value) {
  return { type: 'text', value };
}
function stripPositions(value) {
  if (Array.isArray(value)) {
    return value.map(stripPositions);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== 'position')
        .map(([key, entry]) => [key, stripPositions(entry)])
    );
  }
  return value;
}

test('GT locale registry keeps service availability separate from catalog lists', () => {
  const locales = listGTSupportedLocales();
  assert.equal(locales.length, 133);
  assert.deepEqual(locales, [...new Set(locales)].sort());
  assert.equal(getGTSupportedLocale('zh-Hant-TW'), 'zh-TW');
  assert.equal(getGTSupportedLocale('en-Latn-US'), 'en-US');
  assert.equal(getGTSupportedLocale('not_a_locale'), null);
  locales.length = 0;
  assert.equal(listGTSupportedLocales().length, 133);
});

test('GT Markdown HTML escaping preserves code, entities and heading braces', () => {
  assert.equal(escapeHtml, escapeHtmlInTextNodes);
  const tree = {
    type: 'root',
    children: [
      { type: 'paragraph', children: [text('{name} & &amp; <html> _')] },
      { type: 'heading', depth: 1, children: [text('{title} <tag>')] },
      { type: 'code', lang: 'js', value: '{name} <html>' },
    ],
  };
  unified().use(escapeHtml).runSync(tree);
  assert.equal(
    tree.children[0].children[0].value,
    '&#123;name&#125; &amp; &amp; &lt;html&gt; &#95;'
  );
  assert.equal(tree.children[1].children[0].value, '{title} &lt;tag&gt;');
  assert.equal(tree.children[2].value, '{name} <html>');
});

test('GT custom GFM survives actual parse/stringify/reparse', () => {
  const source =
    '~~gone~~\n\n- [x] done\n\n|a|b|\n|-|-|\n|c|d|\n\nNote[^n]\n\n[^n]: Footnote\n';
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfmCustom)
    .use(remarkStringify);
  const tree = processor.parse(source);
  const serialized = processor.stringify(tree);
  assert.deepEqual(
    stripPositions(processor.parse(serialized)),
    stripPositions(tree)
  );
  assert.equal(tree.children[0].children[0].type, 'delete');
  assert.equal(tree.children[1].children[0].checked, true);
  assert.equal(tree.children[2].type, 'table');
  assert.equal(tree.children.at(-1).type, 'footnoteDefinition');
});

test('GT MDX escaping and CJK normalization preserve expression and code nodes', () => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkStringify)
    .use(preserveEscapedEntities);
  const tree = processor.parse(
    '<Card>hello</Card>\n\n**outside**\n\n`（code）`\n\n{value}\n'
  );
  const card = tree.children[0].children[0];
  card.children = [text('*literal* [x] {unsafe} & &amp;')];
  const paragraph = { type: 'paragraph', children: [text('（日本語）')] };
  tree.children.push(paragraph);
  unified()
    .use(escapeMarkdownInMdxJsxTextNodes)
    .use(normalizeCJKCharacters)
    .runSync(tree);
  assert.equal(
    card.children[0].value,
    escapeMarkdownInMdxJsxText('*literal* [x] {unsafe} & &amp;')
  );
  assert.equal(paragraph.children[0].value, ' (日本語) ');
  const serialized = processor.stringify(tree);
  const reparsed = processor.parse(serialized);
  assert.equal(
    reparsed.children[0].children[0].children[0].value,
    '*literal* [x] {unsafe} & &'
  );
  assert.equal(reparsed.children[1].children[0].type, 'strong');
  assert.equal(reparsed.children[2].children[0].value, '（code）');
  assert.equal(reparsed.children[3].type, 'mdxFlowExpression');
});
