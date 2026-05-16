# lino-i18n-macros

Compile-time macros for [`lino-i18n`](https://crates.io/crates/lino-i18n).

The `i18n!` macro reads every `.lino` file from a directory at compile
time and expands to an `::lino_i18n::I18n` value with every translation
already baked in.

```rust,ignore
use std::sync::OnceLock;
use lino_i18n::{i18n, I18n};

fn catalog() -> &'static I18n {
    static C: OnceLock<I18n> = OnceLock::new();
    C.get_or_init(|| i18n!("locales", default = "en", fallback = "en"))
}
```

Paths are resolved relative to `CARGO_MANIFEST_DIR`. Each `.lino` file is
tracked via a generated `include_str!` so Cargo rebuilds when translations
change.

Licensed under the Unlicense (public domain).
