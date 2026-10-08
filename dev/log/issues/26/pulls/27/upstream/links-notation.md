## Problem

`links-notation` 0.23.0 (crates.io) does not declare `rust-version`, but it needs Rust **1.87**: `src/quotes.rs:131` calls `count.is_multiple_of(2)`, and `unsigned_is_multiple_of` was stabilised in 1.87.

Without `rust-version`:

- Cargo's MSRV-aware resolver (resolver 3, the edition 2024 default) can't skip 0.23.0 for downstream crates with a lower MSRV.
- Users get a compile error instead of a clear "requires rustc 1.87" message.

## Reproduction

```sh
cargo new --lib msrv-repro && cd msrv-repro
cargo add links-notation@0.23.0
cargo +1.86 build
```

```text
   Compiling links-notation v0.23.0
error[E0658]: use of unstable library feature `unsigned_is_multiple_of`
   --> .../links-notation-0.23.0/src/quotes.rs:131:33
    |
131 |     let empty_reference = count.is_multiple_of(2).then(|| Reading {
    |                                 ^^^^^^^^^^^^^^
    = note: see issue #128101 <https://github.com/rust-lang/rust/issues/128101>
```

With `cargo +1.87 build` the crate compiles.

Found in https://github.com/link-foundation/lino-i18n/pull/27, which depends on it through `lino-objects-codec` 0.8.0. The full log is in that PR at `dev/log/issues/26/pulls/27/verification/after-rust-msrv-1.86-fails.log`.

## Workaround used downstream

lino-i18n raised its own `rust-version` to 1.87 and added a CI test leg on 1.87.

## Suggested fix

Declare the real MSRV in `rust/links-notation/Cargo.toml` (and in `links-notation-macro`), and test it in CI:

```toml
[package]
rust-version = "1.87"
```

```yaml
# rust CI matrix
toolchain: [stable, '1.87']
```

Alternatively, keep the old floor by replacing the call with `count % 2 == 0`.
