# lino-i18n

[![JavaScript CI/CD](https://github.com/link-foundation/lino-i18n/actions/workflows/js.yml/badge.svg?branch=main)](https://github.com/link-foundation/lino-i18n/actions/workflows/js.yml)
[![npm](https://img.shields.io/npm/v/lino-i18n?label=npm)](https://www.npmjs.com/package/lino-i18n)
[![GitHub Release](https://img.shields.io/github/v/release/link-foundation/lino-i18n?include_prereleases&label=release)](https://github.com/link-foundation/lino-i18n/releases)

Universal internationalization for JavaScript with translations stored in
[Links Notation](https://github.com/linksplatform/Protocols.Lino) (`.lino`).

Runs on Node.js (≥ 22.11), Bun, Deno, and bundlers like Vite/Webpack/esbuild.

```bash
npm install lino-i18n
```

## Source messages and tooling

```js
import { createTranslator, msg } from 'lino-i18n/messages';
const i18n = createTranslator({
  locales: { fr: { greeting: 'Bonjour {name}' } },
  defaultLocale: 'fr',
});
i18n.gt(msg('Hello {name}', { id: 'greeting' }), { name: 'Ada' });
i18n.gt('{n, plural, one {# file} other {# files}}', { n: 2 });
```

`lino-i18n/react` provides source `T`, `Var`, `Derive`, `Branch`, `Plural` and
formatting components alongside the existing keyed adapter. Optional exports
include `messages`, `intl`, `server`, `react-server`, `tooling` and `compiler`.
[Optional Vue components and SFC extraction](../docs/vue.md) provide reactive
source messages, SSR/hydration and template-scope diagnostics.
[TanStack Start integration](../docs/tanstack-start.md) adds request middleware,
server functions, loader snapshots and localized Router navigation.
The native browser entry retains its dependency-free keyed runtime; source ICU
and React browser applications use a bundler.

```bash
lino-i18n extract --in src --out locales --locale en
lino-i18n check --dir locales --manifest locales/messages.json
```

The complete [source-message guide](../docs/source-messages.md)
covers dictionaries, static derivation, provider candidates, versioned loading,
request isolation and snapshot hydration. The
[GT capability study](../docs/case-studies/issue-25/README.md)
records supported workflows and remaining ecosystem integrations.

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

## Browser

Import `lino-i18n/browser` for native ES modules or browser bundles. This
entry point has no Node built-ins and uses the same translation engine and
`t(key, params, options)` API as the main entry point:

```js
import { createI18n, detectLanguage, loadCatalogs } from 'lino-i18n/browser';

const locales = await loadCatalogs(['/locales/en.lino', '/locales/ru.lino']);
const i18n = createI18n({
  locales,
  defaultLocale: detectLanguage('auto', {
    supportedLanguages: Object.keys(locales),
    defaultLocale: 'en',
  }),
  fallback: ['en'],
});

i18n.t('greeting', { name: 'Ada' });
i18n.setLocale('ru');
i18n.t('greeting', { name: 'Ada' });
```

`loadCatalogs(urls, options)` fetches URLs concurrently and merges every locale
root in URL order. Later catalogs override earlier values for matching keys.
It returns locale tables ready for `createI18n`; errors reject the promise and
identify the failing URL. `options.requestInit` forwards fetch options such as
`cache`, `credentials`, and `signal`. `options.fetch` overrides the platform
fetch, and `options.compatibilityAliases` enables migration aliases after merging.

`detectLanguage(preference, options)` checks an explicit preference first, then
`navigator.languages` in preference order. It uses `navigator.language` when
the language list is empty. `resolveLanguage(preference, candidates, options)`
performs the same matching with a supplied list, without reading the navigator.
Both accept `supportedLanguages` (default `['en']`) and `defaultLocale` (default
`'en'`). Tags are compared without case sensitivity, underscores become hyphens,
and exact tags are tried before parent tags (`pt-BR` before `pt`). An unsupported
preference or `'auto'` defers to candidates, then the default locale, then the
first supported locale. With no supported locales, the default is returned.
Detection also works in environments without a navigator.

The browser instance includes `subscribe`, `addLocale`, and `loadLocale` and
works with `lino-i18n/react`. File methods `loadLocaleFile` and `loadDirectory`
are available through the main entry point. URL loading stays explicit: fetch
more catalogs with `loadCatalogs`, then register their tables with `addLocale`.
ES module exports and `sideEffects: false` let bundlers remove unused helpers.
For TypeScript browser hooks, pass the exported `I18nCoreInstance` type to
`useI18n<I18nCoreInstance>()` or `useTranslation<I18nCoreInstance>()`. Their
default type preserves the main entry point's existing file-loading API.

Run the static browser example from `js/`:

```bash
node examples/browser-usage/server.mjs
# Open http://127.0.0.1:4173/examples/browser-usage/
```

## React

React is an optional peer dependency. The `lino-i18n/react` adapter uses the
same `.lino` catalogues as the framework-independent runtime:

```jsx
import { createI18n } from 'lino-i18n';
import {
  CurrencyFormat,
  I18nProvider,
  LocaleSelector,
  Trans,
  useTranslation,
} from 'lino-i18n/react';

const i18n = createI18n({ locales: catalogues, defaultLocale: 'en' });

function Checkout() {
  const { t } = useTranslation('checkout');
  return (
    <>
      <h1>{t('title')}</h1>
      <Trans
        id="checkout.total"
        values={{ amount: <CurrencyFormat value={19.99} currency="USD" /> }}
      />
      <LocaleSelector labels={{ en: 'English', fr: 'Français' }} />
    </>
  );
}

export default function App() {
  return (
    <I18nProvider i18n={i18n}>
      <Checkout />
    </I18nProvider>
  );
}
```

`useI18n`, `useLocale`, and `useTranslation` update when `setLocale`,
`addLocale`, or an asynchronous catalogue loader changes the instance.
`NumberFormat`, `DateTimeFormat`, `CurrencyFormat`, and `RelativeTimeFormat`
format values with the active locale through the platform `Intl` APIs.

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

Use a `label` child when a translated group also needs its own runtime key:
`error.label` and `error` both resolve to `"Error"`, and an explicit `error`
translation wins over the generated alias.

For migrations from flatter catalogues, enable compatibility aliases when
loading or creating the runtime:

```js
const catalogues = await loadLocalesFromDirectory('./locales', {
  compatibilityAliases: ['collapseTail', 'parentLabel'],
});
const i18n = createI18n({
  locales: catalogues,
  defaultLocale: 'en',
});
```

`collapseTail` exposes underscore-tail aliases for deeper keys, so
`telegram.help.solve.alias.detail` also resolves through
`telegram.help_solve_alias_detail`, `telegram.help.solve_alias_detail`, and
`telegram.help.solve.alias_detail`. `parentLabel` maps `error.label` to the
legacy parent key `error`. Generated aliases never overwrite explicit
translations.

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
- Migration aliases for deeper nested keys and parent labels.
- Namespace prefixes via `:` (`navigation:home`) and `.` (`cart.title`).
- Group label aliases via `label` children.
- Configurable fallback chain.
- Bundled multi-locale `.lino` files and per-language directories.
- Optional missing-key handler.
- Converter CLI for `i18next`, `i18n-js`, and `react-intl`.
- JSON config files via `--config`.

## Scripts

```bash
npm test           # node --test --test-timeout=30000 tests/*.test.js
npm run test:types # browser and React TypeScript API checks
npx playwright install chromium
npm run test:browser # real browser catalog loading and runtime language switching
```

## License

Released into the public domain under the
[Unlicense](https://unlicense.org/).

See [Python extraction, Markdown helpers and GT locale data](../docs/ecosystem-tools.md) for optional source and content tools.

See [React Native source messages](../docs/react-native.md) for native text,
formatters, selectors and persisted locale choices.

See [session recording and replay](../docs/rrweb.md) for the optional published GT recorder/player, `.lino` overlays and protected recorded variables.

See [source-message lint rules](../docs/eslint.md) for optional ESLint diagnostics and [Sanity document catalogs](../docs/sanity.md) for actual GT Studio exports and revision-guarded catalog transport.
