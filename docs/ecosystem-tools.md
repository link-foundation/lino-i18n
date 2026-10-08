# Python extraction, Markdown helpers and GT locale data

These optional tools write the same message manifests and catalogs as JavaScript
extraction. Framework and service dependencies stay behind their own entries.

## Python source extraction

Install Python 3.11 or newer, then use the existing CLI:

```sh
npx lino-i18n extract --syntax python --in ./python-app --out ./catalogs --locale en
```

A `.py` input selects Python automatically. Directory discovery includes Python
files and excludes virtual environments, caches and generated directories. It
writes `messages.json` and `en.lino`, which work with the existing catalog checks,
source review and translation providers.

```js
import { extractPythonMessages } from "lino-i18n/python/extract";

const manifest = await extractPythonMessages(
  `
from gt_flask import t as translate
translate("Hello {name}", name=user.name, _id="hello", _context="Greeting")
`,
  { file: "app.py" },
);
```

Recognized imports are `gt_flask`, `gt_fastapi` and `lino_i18n`, including aliased
imports and namespace calls. This is a source migration/extraction tool;
lino-i18n does not ship a Python runtime or Flask/FastAPI integration.
Python's own [AST parser](https://docs.python.org/3/library/ast.html) validates
syntax and decodes literals. Extraction handles plain ICU sources, concatenation,
deferred `msg`, static `_id`/`_context`, and `derive` inside f-strings. Finite local
functions, conditional literals and dictionary/list lookup can supply derivation
variants. Parameter-dependent returns, imported helpers, star imports,
`declare_var` encodings and arbitrary dynamic expressions are outside this
extractor. Dynamic sources diagnose instead of running application code.

Function/lambda parameters, local writes, comprehensions, classes and match
bindings shadow imports. Methods resolve enclosing function/module scopes rather
than the class namespace. `_id` and `_context` are metadata; ordinary keyword
values such as `id=customer.id` remain runtime data. Derived variants cannot
share one explicit id. Project extraction merges duplicate messages and diagnoses
conflicting ids across files.

`extractPythonProject({ 'app.py': source }, options)` processes explicit source
maps. No application imports or helper functions execute. A file defaults to
1 MiB, 10000 AST nodes, depth 100 and 100 variants; derivation resolution has depth 20. The isolated Python process has a 30-second deadline and capped output.
Where the OS supports `resource` limits, processes also cap address space at 512 MiB and stack at 8 MiB. Options can
select a `python` executable, byte/variant limits and deadline within documented
API bounds. Project file/byte limits match JS extraction; each Python file remains
limited to 1 MiB. CI installs Python 3.14 across all three operating systems and
runs this integration in Node, Bun and Deno.

The [example source](../js/examples/python-usage/sources.py) deliberately contains
a top-level exception: extraction still succeeds because it only parses the file.

## Markdown and MDX

Install `gt-remark`, `unified`, and the parsers/serializer used by your project:

```sh
npm install gt-remark unified remark-parse remark-mdx remark-stringify
```

`lino-i18n/remark` reexports the published GT helper API: default/
`escapeHtmlInTextNodes`, `escapeMarkdownInMdxJsxTextNodes`,
`escapeMarkdownInMdxJsxText`, `remarkGfmCustom`, and `normalizeCJKCharacters`.
It uses GT's actual implementations, with their MIT license and package provenance.
These helpers process AST text; they do not extract translation messages.

```js
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkStringify from "remark-stringify";
import {
  escapeHtmlInTextNodes,
  escapeMarkdownInMdxJsxTextNodes,
  normalizeCJKCharacters,
  preserveEscapedEntities,
} from "lino-i18n/remark";

const processor = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkStringify)
  .use(preserveEscapedEntities)
  .use(normalizeCJKCharacters)
  .use(escapeHtmlInTextNodes)
  .use(escapeMarkdownInMdxJsxTextNodes);
const output = String(await processor.process(markdown));
```

Apply these helpers after your translation step updates text nodes. Code and MDX
expression nodes remain untouched. `preserveEscapedEntities` supplies a text
[serializer extension](https://github.com/syntax-tree/mdast-util-to-markdown)
for character references produced by the helpers. Without it, the default
serializer escapes their ampersands and readers see literal entity codes.
Tests use actual Markdown/MDX parse, stringify and reparse, including GFM tables,
footnotes, task lists, strike-through, JSX text and CJK punctuation.

## GT's supported-service locales

```sh
npm install @generaltranslation/supported-locales
```

```js
import {
  listGTSupportedLocales,
  getGTSupportedLocale,
} from "lino-i18n/providers/gt-locales";

const serviceLocales = listGTSupportedLocales();
getGTSupportedLocale("zh-Hant-TW"); // 'zh-TW' with registry 2.1.41
getGTSupportedLocale("not_a_locale"); // null
```

The adapter uses the published upstream registry and its fallback logic, preserving
regional matches such as `en-Latn-US` to `en-US`. Version 2.1.41 in the test lockfile
contains 133 locales. Returned lists are independent copies. Service availability,
host `Intl` support and installed catalog locales are separate questions; this
registry does not add catalogs or change the translator's configured locale list.
Registry updates come through the optional upstream package, with provenance in
its npm metadata and our lockfile. A catalog loader's `resolveLocale` callback can
use this mapping and explicitly reject `null` before requesting a download.
