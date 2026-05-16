---
'lino-i18n': minor
---

Initial v0.0.1 release of the `lino-i18n` universal i18n library.

This release ships:

- **JavaScript runtime** (`js/`) — `createI18n`, `.lino` loaders, CLDR
  plurals, nested catalogue authoring, multiline quoted values,
  `{{var}}`/`{var}` interpolation, context suffixes, namespaces, fallback
  chains, and a missing-key handler.
- **Converter CLI** (`npx lino-i18n convert`) — turns `i18next` JSON,
  `i18n-js` JSON, and `react-intl` message bundles (AST or string) into
  `.lino` catalogues, with optional single-file bundles and JSON config.
- **Rust runtime** (`rust/lino-i18n`) — same feature set as the JS package
  with idiomatic Rust APIs (`I18n::new`, `t`, `t_count`, `t_with`,
  `TOptions`).
- **`i18n!` proc-macro** (`rust/lino-i18n-macros`) — reads every `*.lino`
  under a directory at compile time and produces a populated
  `lino_i18n::I18n` value from embedded catalogue text, with
  `include_str!`-based file tracking so Cargo rebuilds when translations
  change.
- **Case studies and feature comparison** (`docs/case-studies/issue-1`,
  `docs/case-studies/issue-3`) with i18next, i18n-js, and react-intl.
- **Per-stack CI** — `.github/workflows/js.yml` and
  `.github/workflows/rust.yml` run lint+test matrices on Linux, macOS, and
  Windows for their respective subdirectories.

Released into the public domain under the Unlicense.
