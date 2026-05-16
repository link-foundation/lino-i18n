# lino-i18n

A universal internationalization (i18n) library that stores translations in
[Links Notation](https://github.com/linksplatform/Protocols.Lino) (`.lino`) instead
of JSON or YAML.

The repository ships two implementations and a CLI:

| Path                      | What it is                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| [`js/`](./js)             | The `lino-i18n` JavaScript package (Node.js, Bun, Deno, browsers).                             |
| [`js/bin/lino-i18n.js`](./js/bin) | A converter CLI that turns `i18next`, `i18n-js`, and `react-intl` catalogues into `.lino`. |
| [`rust/`](./rust)         | The `lino-i18n` Rust crate plus the `lino-i18n-macros` companion (`i18n!` compile-time macro). |

Both implementations consume the **same** `.lino` files. They share plural
categories, placeholder syntax, context suffixes, and fallback semantics, so a
catalogue you author once works in either runtime.

Released under the [Unlicense](LICENSE) — public domain.

## Why Links Notation?

Translation files are not data — they are content. JSON is brittle for that
job: every value has to be wrapped in quotes, every nested key needs braces,
and a missing comma breaks the whole file. `.lino` is a quoted-string + nested
identifier format that makes large catalogues comfortable to read in plain
text and trivial to diff.

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

The full design rationale lives in [docs/case-studies/issue-1](./docs/case-studies/issue-1).

## Quick start

### JavaScript

```bash
cd js
npm install
npm test
```

```js
import { createI18n } from 'lino-i18n';
import { loadLinoCatalogue } from 'lino-i18n/loaders';

const i18n = createI18n({ defaultLocale: 'en', fallback: ['en'] });
i18n.addTranslations('en', loadLinoCatalogue('./locales/en.lino').translations);

i18n.t('greeting', { name: 'World' });              // → "Hello, World!"
i18n.t('cart.items', { count: 0 });                 // → "Your cart is empty"
i18n.t('cart.items', { count: 3, locale: 'ru' });   // → "3 товара"
```

### Rust

```bash
cd rust
cargo test
cargo run --example basic
```

```rust
use std::sync::OnceLock;
use lino_i18n::{i18n, I18n, TOptions};

fn catalog() -> &'static I18n {
    static C: OnceLock<I18n> = OnceLock::new();
    C.get_or_init(|| i18n!("locales", default = "en", fallback = "en"))
}

fn main() {
    let c = catalog();
    println!("{}", c.t("greeting", &[("name", "World")]));
    println!("{}", c.t_count("cart.items", 3,
        &[("count", "3")]));
    println!("{}", c.t_with(
        "cart.items",
        &[("count", "3")],
        &TOptions::new().locale("ru").count(3),
    ));
}
```

The `i18n!` macro reads every `*.lino` under the given directory at compile
time and bakes the resulting `(key → value)` tables into the binary. Each
file is tracked through a generated `include_str!`, so Cargo rebuilds when
any catalogue changes.

### CLI conversion

The JavaScript package ships a converter CLI usable through `npx`:

```bash
# Convert i18next JSON to .lino
npx lino-i18n convert --from i18next \
  --in locales/en.json --out locales --locale en

# Convert i18n-js JSON to .lino
npx lino-i18n convert --from i18n-js \
  --in config/locales/en.json --out locales

# Decompile a react-intl message bundle (AST or string) to .lino
npx lino-i18n convert --from react-intl \
  --in messages/en.json --out locales --locale en
```

Run `npx lino-i18n --help` for the full option list.

## Feature comparison

| Feature                           | i18next | i18n-js | react-intl | **lino-i18n**           |
| --------------------------------- | :-----: | :-----: | :--------: | :---------------------: |
| Text-friendly catalogue format    |    ✗    |    ~    |     ✗      | **✓** (`.lino`)         |
| Plural categories (CLDR)          |    ✓    |    ✓    |     ✓      | **✓**                   |
| Placeholder interpolation         |    ✓    |    ✓    |     ✓      | **✓** (`{{x}}` & `{x}`) |
| Context / gender suffixes         |    ✓    |    ~    |     ✗      | **✓**                   |
| Namespaces                        |    ✓    |    ✓    |     ✗      | **✓**                   |
| Fallback locales                  |    ✓    |    ✓    |     ~      | **✓**                   |
| Missing-key handler               |    ✓    |    ~    |     ~      | **✓**                   |
| First-class JS API                |    ✓    |    ✓    |     ✓      | **✓**                   |
| First-class Rust API              |    ✗    |    ✗    |     ✗      | **✓**                   |
| Compile-time embedding (Rust)     |    ✗    |    ✗    |     ✗      | **✓** (`i18n!` macro)   |
| CLI converter from other formats  |    ~    |    ~    |     ~      | **✓**                   |
| Public domain license             |    ✗    |    ✗    |     ✗      | **✓** (Unlicense)       |

See [docs/case-studies/issue-1](./docs/case-studies/issue-1) for the long-form
comparison including code samples and benchmarks.

## Layout

```
.
├── js/
│   ├── bin/lino-i18n.js          # CLI entry point
│   ├── src/                       # JS runtime + converters
│   ├── tests/                     # node --test suites
│   ├── locales/                   # Sample .lino catalogues
│   └── package.json
├── rust/
│   ├── lino-i18n/                 # Runtime crate
│   │   ├── src/
│   │   ├── tests/
│   │   ├── examples/
│   │   └── locales/
│   ├── lino-i18n-macros/          # i18n! proc-macro crate
│   └── Cargo.toml                 # Workspace manifest
├── docs/case-studies/issue-1/     # Design rationale + benchmarks
└── .github/workflows/
    ├── js.yml                     # JS lint+test matrix
    └── rust.yml                   # Rust fmt+clippy+test matrix
```

## CI

Two purpose-built workflows live in `.github/workflows/`:

- **`js.yml`** runs `node --test`, `bun test`, and `deno test` on Linux,
  macOS, and Windows whenever anything under `js/**` changes, plus a CLI
  smoke test that round-trips an `i18next` JSON catalogue to `.lino`.
- **`rust.yml`** runs `cargo fmt --check`, `cargo clippy -D warnings`, and
  `cargo test --all-targets` on the same three operating systems whenever
  anything under `rust/**` changes.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Add a changeset (`bun run changeset` or hand-write a file in `.changeset/`).
4. Make your changes — keep `js/` and `rust/` behaviour consistent.
5. Open a pull request.

Both implementations must pass their CI matrix before a PR can land.

## License

Released into the public domain under the [Unlicense](LICENSE). Use this
library, fork it, vendor it, or strip the attribution — there is no
restriction.
