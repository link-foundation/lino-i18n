# i18next — Feature Inventory

Captured from the official documentation at https://www.i18next.com and the
GitHub repository [i18next/i18next](https://github.com/i18next/i18next).

## Core translation API

- `i18next.init({ resources, lng, fallbackLng, defaultNS, ns, interpolation })`.
- `t(key, options)` with options `count`, `context`, `defaultValue`,
  `lng`, `ns`, `replace`, `returnObjects`.
- `changeLanguage(lng)` reloads namespaces and emits events.
- Events: `initialized`, `languageChanged`, `loaded`, `failedLoading`,
  `missingKey`.

## File / resource formats

- JSON (recommended), JSON5, YAML, PO, .properties, XLIFF (via backends).
- Resources are stored as `{ [lng]: { [ns]: { ...keys } } }`.
- Nested objects are flattened with the configurable `keySeparator`
  (`.` by default) so `t('a.b.c')` resolves into `resources.lng.ns.a.b.c`.

## Interpolation

- Default tokens are `{{var}}`.
- Supports formatters: `{{count, number}}`, `{{date, datetime}}`.
- HTML-escape on by default; can be disabled per call.
- Nesting: `$t(otherKey)` inside a value re-evaluates against the catalogue.

## Plurals

- CLDR plural categories (`zero`, `one`, `two`, `few`, `many`, `other`).
- Activated via the `count` option; resolves to keys
  `<base>_one`, `<base>_other`, etc.
- Compatibility with i18next v3 (`_plural`) is maintained behind a flag.

## Context / gender

- Activated via the `context` option; resolves to `<base>_<context>`,
  e.g. `friend_male`, `friend_female`.

## Namespaces

- Multiple namespaces can be active at once. Default separator is `:`,
  so `t('common:cancel')` selects the `common` namespace.

## Backends and detectors

- Filesystem backend (`i18next-fs-backend`).
- HTTP backend (`i18next-http-backend`).
- Language detector (`i18next-browser-languagedetector`,
  `i18next-electron-fs-backend`).
- Caches: localStorage, memory, sessionStorage.

## React bindings

- `react-i18next` exposes `useTranslation()`, `<Trans>`, `withTranslation()`.

## Things we adopt

- Nested keys via `.` separator.
- Namespaces via `:` separator.
- CLDR plural suffixes.
- `defaultValue`, `count`, `context`, `lng` options.
- `missingKey` callback.
