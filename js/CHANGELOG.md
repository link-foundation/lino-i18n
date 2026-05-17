# lino-i18n Changelog

## 0.0.2

### Patch Changes

- 29f0d6f: Preserve scalar parent translations as `label` children when formatting nested
  catalogues, and resolve `foo` from `foo.label` when no explicit `foo`
  translation exists.

## 0.0.1

Initial release of the JavaScript `lino-i18n` package.

- Runtime i18n API with `.lino` catalogue loading.
- Converter CLI for i18next, i18n-js, and react-intl catalogues.
- Node.js, Bun, and Deno test coverage.
- Automated npm publishing, GitHub release creation, and generated docs
  deployment through `.github/workflows/js.yml`.
