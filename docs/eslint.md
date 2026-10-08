# Source-message linting

The optional `lino-i18n/eslint` export checks source messages with the same static
extractor used by catalog tooling. It supports ESLint 9/10 flat configuration and
does not import React or execute application code.

```js
import lino from "lino-i18n/eslint";

export default [
  {
    ...lino.configs.recommended,
    files: ["src/**/*.{js,jsx}"],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  },
];
```

Install ESLint separately. For TypeScript/TSX, configure an ESLint parser that
supports your installed ESLint version; the internal static analysis already
understands TypeScript. The default export is typed as an actual ESLint plugin.

The executable example can be checked from `js/` with:

```sh
npx eslint --config examples/lint-usage/eslint.config.js examples/lint-usage/source.jsx
```

| Rule                                | Diagnostics                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `lino-i18n/static-string`           | Dynamic source strings/metadata, malformed ICU, unsupported finite derivation and dictionaries.            |
| `lino-i18n/static-jsx`              | Dynamic source children, dynamic ids, missing named variables or branch fallbacks, unsupported source JSX. |
| `lino-i18n/no-data-attrs-on-branch` | `data-*` attributes on an imported headless `Branch`, which cannot forward them to a DOM element.          |

Import aliases, namespace imports, local translator factories, immutable local
bindings and shadowing follow extraction's binding rules. Unrelated functions or
components with the same name are ignored. The linter analyzes one file; use
`extractProject` or the CLI for imported local helper/barrel graphs.

```jsx
import { T } from "lino-i18n/react";
const greeting = <T>Hello {name}</T>; // static-jsx diagnostic
```

For a direct identifier child, the editor offers a suggestion to wrap the value
in an explicitly named `Var`, adding a collision-free import when needed:

```jsx
import { T, Var } from "lino-i18n/react";
const greeting = (
  <T>
    Hello <Var name="name">{name}</Var>
  </T>
);
```

This suggestion preserves a leading `'use client'` directive and evaluates the
value once. Suggestions require an editor action; `eslint --fix` does not choose
variable names, flatten concatenations or rewrite conditionals into branches.
Complex cases retain diagnostics so authors can choose their message semantics.
GT's linter uses different Branch props and variable naming conventions, so its
fixes cannot be applied directly to lino-i18n JSX.

Each rule accepts optional `maxBytes`, `maxNodes` and `maxDepth` limits. Defaults
are 1 MiB UTF-8 source, 100,000 AST nodes and 100 AST levels; hard maxima are
10 MiB, 200,000 nodes and 200 levels. The ESLint parser runs before the plugin;
these budgets bound the plugin's additional analysis. Results are cached for the
source object and identical options across the three rules. Keep `static-string`
enabled to receive shared analysis/budget errors.

Actual ESLint 9/10 and Babel TypeScript/TSX parser regression tests cover valid descriptors/derivation, aliases,
shadowing, malformed ICU, JSX suggestions, directive preservation and finite
budgets. This plugin supplies local diagnostics, not GT's hosted agent protocol
or an extraction daemon.

The plugin follows ESLint's official [plugin](https://eslint.org/docs/latest/extend/plugins)
and [rule](https://eslint.org/docs/latest/extend/custom-rules) contracts. The pinned
GT rule sources and capability comparison are saved in the [case study](case-studies/issue-25/README.md).
