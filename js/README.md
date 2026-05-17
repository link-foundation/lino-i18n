# lino-i18n

[![JavaScript CI/CD](https://github.com/link-foundation/lino-i18n/actions/workflows/js.yml/badge.svg?branch=main)](https://github.com/link-foundation/lino-i18n/actions/workflows/js.yml)
[![npm](https://img.shields.io/npm/v/lino-i18n?label=npm)](https://www.npmjs.com/package/lino-i18n)
[![GitHub Release](https://img.shields.io/github/v/release/link-foundation/lino-i18n?include_prereleases&label=release)](https://github.com/link-foundation/lino-i18n/releases)

Universal internationalization for JavaScript with translations stored in
[Links Notation](https://github.com/linksplatform/Protocols.Lino) (`.lino`).

Runs on Node.js (≥ 20), Bun, Deno, and bundlers like Vite/Webpack/esbuild.

```bash
npm install lino-i18n
```

## Usage

```js
import { createI18n } from 'lino-i18n';
import { loadLocalesFromDirectory } from 'lino-i18n/loaders';

const catalogues = await loadLocalesFromDirectory('./locales');
const i18n = createI18n({
  locales: catalogues,
  defaultLocale: 'en',
  fallback: ['en'],
});

i18n.t('greeting', { name: 'World' }); // → "Hello, World!"
i18n.t('cart.items', { count: 0 }); // → "Your cart is empty"
i18n.t('cart.items', { count: 3 }, { locale: 'ru' }); // → "3 товара"
i18n.t('role', { context: 'female' }); // → "She is a developer"
i18n.t('telegram.help.solve.alias.detail'); // → "Tool aliases imply `--tool <tool>`"
```

A sample `.lino` catalogue looks like this:

```lino
en
  greeting "Hello, {{name}}!"
  telegram
    help
      title "Help"
      solve
        alias
          detail "Tool aliases imply `--tool <tool>`"
  prompt
    system
      general
        guidelines
          header "General guidelines."
          body """
            When you start, create a detailed plan for yourself.
            Follow your todo list step by step.
          """
  error
    label "Error"
    invalid
      github
        url "Error: Invalid GitHub URL format"
  cart
    title "Your cart"
    items
      zero "Your cart is empty"
      one "{{count}} item"
      other "{{count}} items"
  role
    male "He is a developer"
    female "She is a developer"
    other "They are a developer"
```

Deeply nested blocks flatten to canonical dot keys such as
`telegram.help.solve.alias.detail` and
`prompt.system.general.guidelines.body`. Nested plural and context groups still
flatten to runtime suffix keys such as `cart.items_one`, `cart.items_other`,
and `role_female`. A single file may also contain several top-level locale
blocks, for example `en` followed by `ru`.

When a namespace also needs a translated label, author it explicitly as a child
such as `error.label`. Built-in parent aliases like `error → error.label` are
tracked in [issue #10](https://github.com/link-foundation/lino-i18n/issues/10).
Old underscore-tail migration aliases such as
`telegram.help_solve_alias_detail` are tracked in
[issue #11](https://github.com/link-foundation/lino-i18n/issues/11); keep those
aliases in application code until that helper is available.

## CLI

The package ships a converter that turns popular i18n formats into
`.lino`:

```bash
# i18next JSON → .lino
npx lino-i18n convert --from i18next \
  --in locales/en.json --out locales --locale en

# i18n-js JSON → .lino
npx lino-i18n convert --from i18n-js \
  --in config/locales/en.json --out locales

# react-intl bundle (AST or string) → .lino
npx lino-i18n convert --from react-intl \
  --in messages/en.json --out locales --locale en

# Bundle all converted locales into one .lino file
npx lino-i18n convert --from i18next \
  --in locales-json --out locales --single-file all.lino
```

Run `npx lino-i18n --help` for every option.

## Features

- CLDR plural categories via `Intl.PluralRules`.
- Nested `.lino` authoring with multiline quoted values.
- `{{var}}` and `{var}` placeholder syntax for compatibility with i18next
  and `react-intl`.
- Context (gender) suffixes: `role_male`, `role_female`, `role_other`.
- Namespace prefixes via `:` (`navigation:home`) and `.` (`cart.title`).
- Configurable fallback chain.
- Bundled multi-locale `.lino` files and per-language directories.
- Optional missing-key handler.
- Converter CLI for `i18next`, `i18n-js`, and `react-intl`.
- JSON config files via `--config`.

## Scripts

```bash
npm test           # node --test --test-timeout=30000 tests/*.test.js
```

## License

Released into the public domain under the
[Unlicense](https://unlicense.org/).
