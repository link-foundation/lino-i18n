# lino-i18n-macros

[![Rust CI/CD](https://github.com/link-foundation/lino-i18n/actions/workflows/rust.yml/badge.svg?branch=main)](https://github.com/link-foundation/lino-i18n/actions/workflows/rust.yml)
[![Crates.io](https://img.shields.io/crates/v/lino-i18n-macros?label=crates.io)](https://crates.io/crates/lino-i18n-macros)
[![Docs.rs](https://docs.rs/lino-i18n-macros/badge.svg)](https://docs.rs/lino-i18n-macros)
[![GitHub Release](https://img.shields.io/github/v/release/link-foundation/lino-i18n?include_prereleases&label=release)](https://github.com/link-foundation/lino-i18n/releases)

Compile-time macros for [`lino-i18n`](https://crates.io/crates/lino-i18n).

The `i18n!` macro reads every `.lino` file from a directory at compile
time and expands to an `::lino_i18n::I18n` value populated from embedded
catalogue text.

```rust,ignore
use std::sync::OnceLock;
use lino_i18n::{i18n, I18n};

fn catalog() -> &'static I18n {
    static C: OnceLock<I18n> = OnceLock::new();
    C.get_or_init(|| i18n!("locales", default = "en", fallback = "en"))
}
```

Paths are resolved relative to `CARGO_MANIFEST_DIR`. Each `.lino` file is
tracked through `include_str!` so Cargo rebuilds when translations change.

Licensed under the Unlicense (public domain).
