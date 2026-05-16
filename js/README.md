# lino-i18n

Universal internationalization for JavaScript with translations stored in
[Links Notation](https://github.com/linksplatform/Protocols.Lino) (`.lino`).

Runs on Node.js (≥ 20), Bun, Deno, and bundlers like Vite/Webpack/esbuild.

```bash
npm install lino-i18n
```

## Usage

```js
import { createI18n } from 'lino-i18n';
import { loadLinoCatalogue } from 'lino-i18n/loaders';

const i18n = createI18n({ defaultLocale: 'en', fallback: ['en'] });

const en = loadLinoCatalogue('./locales/en.lino');
i18n.addTranslations(en.locale, en.translations);

i18n.t('greeting', { name: 'World' });            // → "Hello, World!"
i18n.t('cart.items', { count: 0 });               // → "Your cart is empty"
i18n.t('cart.items', { count: 3, locale: 'ru' }); // → "3 товара"
i18n.t('role', { context: 'female' });            // → "She is a developer"
```

A sample `.lino` catalogue looks like this:

```lino
en
  greeting "Hello, {{name}}!"
  cart.title "Your cart"
  cart.items_zero "Your cart is empty"
  cart.items_one "{{count}} item"
  cart.items_other "{{count}} items"
  role_male "He is a developer"
  role_female "She is a developer"
  role_other "They are a developer"
```

## CLI

The package ships a converter that turns popular i18n formats into
`.lino`:

```bash
# i18next JSON → .lino
npx lino-i18n convert --from i18next --to lino \
  --input locales/en.json --output locales/en.lino --locale en

# ruby-i18n / i18n-js YAML → .lino
npx lino-i18n convert --from i18n-js --to lino \
  --input config/locales/en.yml --output locales/en.lino

# react-intl bundle (AST or string) → .lino
npx lino-i18n convert --from react-intl --to lino \
  --input messages/en.json --output locales/en.lino --locale en
```

Run `npx lino-i18n --help` for every option.

## Features

- CLDR plural categories via `Intl.PluralRules`.
- `{{var}}` and `{var}` placeholder syntax for compatibility with i18next
  and `react-intl`.
- Context (gender) suffixes: `role_male`, `role_female`, `role_other`.
- Namespace prefixes via `:` (`navigation:home`) and `.` (`cart.title`).
- Configurable fallback chain.
- Optional missing-key handler.
- Converter CLI for `i18next`, `i18n-js`, and `react-intl`.

## Scripts

```bash
npm test           # node --test --test-timeout=30000 tests/*.test.js
```

## License

Released into the public domain under the
[Unlicense](https://unlicense.org/).
