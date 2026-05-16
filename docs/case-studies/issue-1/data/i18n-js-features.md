# i18n-js — Feature Inventory

Captured from https://www.npmjs.com/package/i18n-js and the
[`fnando/i18n`](https://github.com/fnando/i18n) repository.

## Core translation API

- `I18n.translations` is a `{ [locale]: { ... } }` map.
- `i18n.t(key, options)` and the alias `i18n.translate(key, options)`.
- `i18n.locale = 'es'` and `i18n.defaultLocale = 'en'`.
- `i18n.missingTranslation.register(handler)` for custom missing-key handling.
- Scopes via `options.scope` (`{ scope: 'cart' }`).
- Defaults via `options.defaultValue` or `options.defaults` (array of
  fallback keys).

## File format

- JSON (loaded explicitly or via a Rails sprocket build step).
- The Ruby version supports YAML; the JS version expects JSON in memory.

## Interpolation

- Tokens are `%{var}` (Ruby/Rails style).
- Supports `{{count}}` only when the helpers are configured.
- Date/number formatting via `i18n.l(format, value)` and
  `i18n.toNumber(value)` / `toCurrency(value)`.

## Plurals

- CLDR-aware via `make-plural`-style packs.
- Pluralisation triggered by `count` option; chooses
  `zero`, `one`, `other`, etc.

## Scopes

- Single-level prefix; nested via `scope: ['cart', 'checkout']`.
- No native namespaces; scopes act as prefix only.

## Things we adopt

- Defaults via fallback key array.
- `count` option for plurals.
- Date/number helpers delegated to `Intl.*`.

## Things we intentionally drop

- `%{}` token style is exposed as an option but not the default.
  We prefer the `{{var}}` style for consistency with i18next.
