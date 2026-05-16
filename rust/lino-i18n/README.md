# lino-i18n

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
crate's `CARGO_MANIFEST_DIR`) at compile time and bakes the resulting
translation tables into the binary.

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
- `{{var}}` and `{var}` placeholder syntax for compatibility with i18next
  and `react-intl`.
- Context (gender) suffixes: `role_male`, `role_female`, `role_other`.
- Namespace prefixes with `.` (e.g. `navigation.home`).
- Configurable fallback chain plus per-call `default_value`.
- Optional missing-key handler hook.
- Compile-time embedding via the `i18n!` macro.

## License

Released into the public domain under the
[Unlicense](https://unlicense.org/).
