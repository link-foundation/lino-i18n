# lino-i18n

[![Rust CI/CD](https://github.com/link-foundation/lino-i18n/actions/workflows/rust.yml/badge.svg?branch=main)](https://github.com/link-foundation/lino-i18n/actions/workflows/rust.yml)
[![Crates.io](https://img.shields.io/crates/v/lino-i18n?label=crates.io)](https://crates.io/crates/lino-i18n)
[![Docs.rs](https://docs.rs/lino-i18n/badge.svg)](https://docs.rs/lino-i18n)
[![GitHub Release](https://img.shields.io/github/v/release/link-foundation/lino-i18n?include_prereleases&label=release)](https://github.com/link-foundation/lino-i18n/releases)

Universal internationalization for Rust, with translations stored in
[Links Notation](https://github.com/linksplatform/Protocols.Lino) (`.lino`).

```toml
[dependencies]
lino-i18n = { version = "0.0.1", features = ["macros"] }
```

## Quick start

```rust
use std::sync::OnceLock;
use lino_i18n::{i18n, I18n, TOptions};

fn catalog() -> &'static I18n {
    static C: OnceLock<I18n> = OnceLock::new();
    C.get_or_init(|| i18n!("locales", default = "en", fallback = "en"))
}

fn greet(name: &str) -> String {
    catalog().t("greeting", &[("name", name)])
}
```

`i18n!` reads every `*.lino` file under the directory (relative to the
crate's `CARGO_MANIFEST_DIR`) at compile time, embeds the catalogue text, and
builds translation tables when the `I18n` value is initialized.

Catalogues are authored as nested Links Notation blocks:

```lino
en
  greeting "Hello, {{name}}!"
  hero
    description """
      Keep each language in its own block, nest related messages together,
      and still resolve the same runtime keys.
    """
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

The loader flattens nested plural and context groups to runtime suffix keys
such as `cart.items_one` and `role_female`. One file may contain several
top-level locale blocks, so both `locales/en.lino` and a bundled
`locales/all.lino` layout work.

## Runtime API

The runtime is also usable without the macro:

```rust
use lino_i18n::{I18n, TOptions};

let mut i18n = I18n::new("en");
i18n.load_lino_file("locales/en.lino").unwrap();
i18n.load_lino_file("locales/ru.lino").unwrap();
i18n.set_fallbacks(["en".to_string()]);

assert_eq!(i18n.t("greeting", &[("name", "World")]), "Hello, World!");

assert_eq!(
    i18n.t_count("cart.items", 0, &[("count", "0")]),
    "Your cart is empty"
);

assert_eq!(
    i18n.t_with(
        "cart.items",
        &[("count", "3")],
        &TOptions::new().locale("ru").count(3),
    ),
    "3 товара"
);
```

## Features

- CLDR plural categories for the locales people actually translate into.
- Nested `.lino` authoring with multiline quoted values.
- `{{var}}` and `{var}` placeholder syntax for compatibility with i18next
  and `react-intl`.
- Context (gender) suffixes: `role_male`, `role_female`, `role_other`.
- Namespace prefixes with `.` (e.g. `navigation.home`).
- Configurable fallback chain plus per-call `default_value`.
- Bundled multi-locale `.lino` files and per-language directories.
- Optional missing-key handler hook.
- Compile-time embedding via the `i18n!` macro.

## License

Released into the public domain under the
[Unlicense](https://unlicense.org/).
