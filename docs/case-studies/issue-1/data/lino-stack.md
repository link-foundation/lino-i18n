# Links Notation Stack

## `links-notation`

- Repo: https://github.com/link-foundation/links-notation
- JS package: [`links-notation`](https://www.npmjs.com/package/links-notation) (0.13.0)
- Rust crate: [`links-notation`](https://crates.io/crates/links-notation) (0.13.0)
- Provides the `Parser`, `Link`, `LinksGroup`, `FormatConfig`,
  `FormatOptions` APIs and PEG.js / hand-written grammar.

## `lino-objects-codec`

- Repo: https://github.com/link-foundation/lino-objects-codec
- JS package: [`lino-objects-codec`](https://www.npmjs.com/package/lino-objects-codec) (0.4.0)
- Rust crate: [`lino-objects-codec`](https://crates.io/crates/lino-objects-codec) (0.2.x)
- Key exports we use:
  - `parseIndented({ text })` → `{ id, obj }` where `obj` is a plain
    JS object with keys preserved (dots/colons allowed when the key
    is an unquoted reference).
  - `formatIndented({ id, obj })` for writing back.
  - `jsonToLino({ json })` / `linoToJson({ text })` for tooling.
- For Rust we use the `LinoValue` enum and `decode_indented` /
  `encode_indented` helpers (depending on minor version exposed).

## `lino-arguments`

- Repo: https://github.com/link-foundation/lino-arguments
- JS package: [`lino-arguments`](https://www.npmjs.com/package/lino-arguments) (0.3.0)
- Rust crate: [`lino-arguments`](https://crates.io/crates/lino-arguments) (0.3.0)
- Provides `makeConfig({ yargs })` (JS) and helpers like `getenv_int`,
  `getenv_bool` (Rust) backed by `lino-env`, `dotenvy`, and `clap`.
- In the CLI we use it to combine command-line flags, environment
  variables, and optional `lino-i18n.lino` configuration files.

## Indented Links Notation cheat sheet for translations

```lino
en
  greeting "Hello, {{name}}!"
  cart.items_zero "Your cart is empty"
  cart.items_one  "{{count}} item"
  cart.items_other "{{count}} items"
  navigation:home "Home"
  navigation:profile "Profile"
```

- The first un-indented line is the locale identifier.
- Each indented line is a key/value doublet.
- Values are written as quoted strings when they contain whitespace,
  punctuation, or `{{var}}` placeholders.
- Keys may contain `.` (for nested namespaces) and `:` (for explicit
  namespaces) because both characters are valid inside a plain
  reference in Links Notation.
