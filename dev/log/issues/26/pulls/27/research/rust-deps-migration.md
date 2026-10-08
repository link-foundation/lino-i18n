# Rust dependency migration research (issue #26 / PR #27)

Date: 2026-10-08. Scope: `rust/` workspace (`lino-i18n`, `lino-i18n-macros`) and the
`rust/scripts/*.rs` rust-script helpers. All experiments ran on copies
(`/tmp/research-rust`, `/tmp/research-rust-scripts`); the repository was not edited.

## TL;DR

| Item | Current | Target | Code changes needed |
|---|---|---|---|
| `lino-objects-codec` (both crates) | `0.2.1` | `0.8.0` | none (crate is declared but **not imported anywhere** in Rust code) |
| `syn` (macros) | `2` (`full`) | `3.0.6` | none (only `LitStr`, `Ident`, `Token!`, `ParseStream`, `parse_macro_input!`, `Error` are used) |
| `proc-macro2` / `quote` | `1` | `1.0.107` / `1.0.47` | none |
| `edition` | `2021` | `2024` | rustfmt 2024 style only (import ordering + one `;`) — 5 files, 10 lines |
| `rust-version` | `1.75` (already false) | **`1.87`** | none; 1.85 is NOT enough (see MSRV section) |
| `resolver` | `"2"` | `"3"` (edition 2024 default, MSRV-aware) | none |
| `Cargo.lock` | format v3 | regenerate → v4 | `rm Cargo.lock && cargo generate-lockfile` |
| `ureq` (4 scripts + `registry-state.rs`) | `2` | `3` (3.4.2) | yes, API migration (diff below) |
| `toml` (`check-version-modification.rs`) | `0.8` | `1` (1.1.7) | yes — **compiles unchanged but breaks at runtime** (diff below) |
| `regex`/`serde`/`serde_json`/`chrono`/`walkdir` | `1`/`1`/`1`/`0.4`/`2` | latest already inside range | none (rust-script resolves fresh each time) |
| `cargo-audit` (security.yml) | `0.22.2` | `0.22.2` is latest | none; 0 advisories on upgraded trees |
| `rust-script` (CI) | `0.36.0` | `0.36.0` is latest | none |

## 1. Usage inventory (call sites)

Command: `grep -rn 'lino_objects_codec\|syn::\|ureq\|toml::' --include=*.rs rust/`

### lino-objects-codec
- Declared in `rust/lino-i18n/Cargo.toml:23` and `rust/lino-i18n-macros/Cargo.toml:25`.
- **Zero uses** in any `.rs` file. History: `git log -S lino_objects_codec -- rust` shows commit
  `d32cd24 feat: add nested lino catalogue authoring` removed the last uses
  (`use lino_objects_codec::format::parse_indented;` and `format_indented_ordered`) when the
  hand-written nested parser in `rust/lino-i18n/src/loader.rs` replaced them
  (`parse_indented` returns a flat `HashMap<String,String>`, unable to express nested blocks;
  see `docs/case-studies/issue-3/README.md:44-47`).
- The dependency is kept to satisfy requirement R4 of issue #1
  (`docs/case-studies/issue-1/README.md:51` "Use `lino-objects-codec` as a dependency").
  Experiment: deleting both lines builds and passes all tests and shrinks the tree to
  `proc-macro2/quote/syn/unicode-ident` — this is an option, not done by default.

### syn / proc-macro2 / quote (`rust/lino-i18n-macros/src/lib.rs`)
- `:27` `use syn::parse::{Parse, ParseStream};`
- `:28` `use syn::{parse_macro_input, LitStr, Token};`
- `:46` `fn parse(input: ParseStream<'_>) -> syn::Result<Self>`
- `:56` `syn::Ident`; `:64,98,114,124,130,136,207` `syn::Error::new(span, msg)`
- `:86` `syn::Error::into_compile_error`; `:90,192` `syn::Result`
- None of these APIs is touched by the syn 3.0 breaking-change list.

### ureq
- `rust/scripts/registry-state.rs:21-31` (included via `#[path]` by `publish-crate.rs:36`,
  `wait-for-crate.rs:35`, `version-and-commit.rs`, `check-release-needed.rs`) — this is the
  only ureq code that `publish-crate.rs` and `wait-for-crate.rs` compile.
- `rust/scripts/check-release-needed.rs:111-117` (Docker Hub), `:131-145` (GitHub release),
  `:184-226` (crates.io version list).
- `rust/scripts/version-and-commit.rs:285-326` (crates.io version list).
- Manifests: `publish-crate.rs:23`, `wait-for-crate.rs:23`, `check-release-needed.rs:40`,
  `version-and-commit.rs:21`.

### toml
- `rust/scripts/check-version-modification.rs:5` (`toml = "0.8"`), `:12-13`
  `text.parse::<toml::Value>()` on a whole Cargo.toml document.

## 2. Upstream changelogs / breaking changes

### lino-objects-codec 0.2.1 → 0.8.0
Source: `gh api repos/link-foundation/lino-objects-codec/contents/rust/CHANGELOG.md`,
releases `gh release list --repo link-foundation/lino-objects-codec`
(https://github.com/link-foundation/lino-objects-codec/blob/main/rust/CHANGELOG.md).

- 0.3.0: "`encode()` now produces indented, plain-text Links Notation by default … `decode()`
  accepts both the readable and the previous compact form"; "Raised the `links-notation`
  dependency to 0.14".
- 0.6.0: "`encode` and `encode_line` never reach for base64 …"; quote runs `"""say "hi""""`.
- 0.7.0: "Moved the crate to edition 2024 and raised `rust-version` from 1.70 to 1.85."
  links-notation 0.14 → 0.16.1; base64 0.22 → 0.23.1.
- 0.8.0 (2026-10-07): "Public single-line and verbatim value formatting helpers, and an
  optional lossless `serde_json::Value` bridge"; "Update links-notation to 0.23.0".
- None affects lino-i18n because nothing is imported. `format::parse_indented`,
  `format_indented`, `format_indented_ordered` still exist in 0.8.0 (`rust/src/format.rs:160,194,253`).

### syn 3.0.0
Source: `gh release view 3.0.0 --repo dtolnay/syn` (https://github.com/dtolnay/syn/releases/tag/3.0.0).
Breaking changes are all syntax-tree level: new `*Modifiers` structs; `Type::BareFn` →
`Type::FnPtr`; `Arm::guard` → `Pat::Guard`; `Signature::unsafety` → `Safety`;
"`LitInt` and `LitFloat` no longer implement `From<proc_macro2::Literal>`"; "`The pop method
of Punctuated<T, P> now returns Option<T>`"; "`The Speculative and AnyDelimiter traits have been sealed`";
"`Lifetime` … no longer permits keyword lifetimes". The macro crate uses none of these;
it compiled unchanged. `links-notation-macro 0.1.0` (pulled by links-notation 0.23) also uses
syn 3, so the lockfile has a single `syn` version.

### ureq 2 → 3
Source: https://github.com/algesten/ureq/blob/main/MIGRATE-2-to-3.md and CHANGELOG.md.
- "ureq 3.x is a ground up complete rewrite of ureq 2.x" … "we drop our own impl in favor of
  the [http crate]".
- "ureq 2.x did an automatic retry of idempotent methods (GET, HEAD) … 3.x has no built-in retries."
- CHANGELOG 3.2.0: "Bump MSRV 1.71 -> 1.85, edition 2024 #1167".
- API mapping used here (verified in `ureq-3.4.2/src`):
  - `.timeout(d)` → `.config().timeout_global(Some(d)).build()` ("Timeout for the entire call …
    from DNS lookup to finishing reading the response body", `config.rs:720-726`).
  - `.set(k, v)` → `.header(k, v)`.
  - `Error::Status(404, _)` → `Error::StatusCode(404)`; "When `http_status_as_error()` is true,
    4xx and 5xx response status codes are translated to this error. This is the default
    behavior." (`error.rs:10-14`). So `Ok(response)` arms still only see < 400.
  - `response.into_string()` → `response.into_body().read_to_string()` (default 10 MB limit;
    crates.io/GitHub JSON bodies are far smaller).
  - `response.status()` is now `http::StatusCode`; `== 200` still compiles
    (`PartialEq<u16>`), `Display` prints `"404 Not Found"`.

### toml 0.8 → 1.x
Source: https://github.com/toml-rs/toml/blob/main/crates/toml/CHANGELOG.md
- 0.9.0 Breaking: "**`impl FromStr for Value` now parses TOML values, not documents**";
  "`from_str`, `Deserializer`, etc no longer preserve order"; serde/std split into default features.
- 1.0.0: "Wrap `Time::second` and `Time::nanosecond` in `Option`".
- 1.1.0: "Update MSRV to 1.85".

## 3. MSRV / edition

`curl -s -A research https://crates.io/api/v1/crates/<name>/<version>` → `rust_version`:

| crate | version | rust_version | edition |
|---|---|---|---|
| lino-objects-codec | 0.8.0 | 1.85 | 2024 |
| links-notation | 0.23.0 | **none declared** | 2021 |
| links-notation-macro | 0.1.0 | none declared | 2021 |
| base64 | 0.23.1 | 1.71.0 | 2021 |
| nom | 8.0.0 | 1.65.0 | 2021 |
| syn | 3.0.6 | 1.71 | 2021 |
| proc-macro2 | 1.0.107 | 1.71 | 2021 |
| quote | 1.0.47 | 1.71 | 2021 |
| memchr / unicode-ident | 2.8.3 / 1.0.26 | 1.61 / 1.71 | 2021 |
| ureq | 3.4.2 | 1.85 | 2024 |
| toml | 1.1.7+spec-1.1.0 | 1.85 | 2024 |
| regex / serde / serde_json / chrono | 1.13.1 / 1.0.229 / 1.0.151 / 0.4.45 | 1.65 / 1.56 / 1.71 / 1.62 | 2021 |
| cargo-audit | 0.22.2 | 1.88 | 2024 |

Actual toolchain tests on the upgraded workspace (`rustup toolchain install 1.84.0 1.85.0 1.86.0 1.87.0 1.99.0`):

```
$ cargo +1.84.0 build
error: failed to parse manifest at `.../lino-objects-codec-0.8.0/Cargo.toml`
  feature `edition2024` is required

$ cargo +1.85.0 build --locked   # same with 1.86.0
error[E0658]: use of unstable library feature `unsigned_is_multiple_of`
   --> links-notation-0.23.0/src/quotes.rs:131:33
131 |     let empty_reference = count.is_multiple_of(2).then(|| Reading {

$ cargo +1.87.0 build/test/clippy --locked --all-targets --all-features -- -D warnings
Finished … all tests ok, clippy clean
```

So the honest floor is **`rust-version = "1.87"`** (`u32::is_multiple_of` stabilized in 1.87;
links-notation 0.23 does not declare an MSRV, and lino-objects-codec 0.8's declared 1.85 is
itself unreachable). The current `1.75` was already false (codec 0.2.1 tree built, but
anything ≥ 0.7 needs 1.85+). If the codec dependency were dropped the floor would be 1.71
(syn 3) — but edition 2024 needs 1.85 anyway.

Edition 2024 is feasible: `cargo fix --edition --all-targets` produced **no source changes**
(only migrated manifests). After setting `edition = "2024"` the only diff is rustfmt's 2024
style edition (version-sorted imports, `;` after a `return Err(...)` in a match arm). CI runs
`cargo fmt --check`, so `cargo fmt --all` must be applied.

With edition 2024, set `resolver = "3"` (MSRV-aware resolution). `cargo update` then reports
"Locking 0 packages to latest Rust 1.87 compatible versions" — no holdbacks.

Lockfile: the committed `Cargo.lock` is format `version = 3` (cargo writes v3 while
`rust-version < 1.78`). `cargo update` keeps v3; `rm Cargo.lock && cargo generate-lockfile`
produces `version = 4` with the identical package set.

## 4. Verified workspace diff

Checks run in `/tmp/research-rust` (all passed on 1.98.1, 1.99.0 and 1.87.0):
`cargo build --locked --all-targets`, `cargo test --locked --all-targets` (29 + 9 + 1 tests),
`cargo test --doc`, `cargo clippy --locked --all-targets --all-features -- -D warnings`
(workspace pedantic lints), `cargo fmt --all -- --check`, `RUSTDOCFLAGS='-D warnings' cargo doc --no-deps`,
`cargo publish --dry-run --workspace`.

Lockfile package changes: base64 0.22.1→0.23.1, links-notation 0.13.0→0.23.0,
+links-notation-macro 0.1.0, lino-objects-codec 0.2.1→0.8.0, memchr 2.8.0→2.8.3,
proc-macro2 1.0.106→1.0.107, quote 1.0.45→1.0.47, syn 2.0.117→3.0.6, unicode-ident 1.0.24→1.0.26.

```diff
diff --git a/Cargo.toml b/Cargo.toml
index d47735d..f12930f 100644
--- a/Cargo.toml
+++ b/Cargo.toml
@@ -1,5 +1,5 @@
 [workspace]
-resolver = "2"
+resolver = "3"
 members = [
     "lino-i18n",
     "lino-i18n-macros",
@@ -7,8 +7,8 @@ members = [
 
 [workspace.package]
 version = "0.3.0"
-edition = "2021"
-rust-version = "1.75"
+edition = "2024"
+rust-version = "1.87"
 license = "Unlicense"
 repository = "https://github.com/link-foundation/lino-i18n"
 homepage = "https://github.com/link-foundation/lino-i18n"
diff --git a/lino-i18n-macros/Cargo.toml b/lino-i18n-macros/Cargo.toml
index 6ede21e..73cd782 100644
--- a/lino-i18n-macros/Cargo.toml
+++ b/lino-i18n-macros/Cargo.toml
@@ -19,7 +19,7 @@ workspace = true
 proc-macro = true
 
 [dependencies]
-proc-macro2 = "1"
-quote = "1"
-syn = { version = "2", features = ["full"] }
-lino-objects-codec = "0.2.1"
+proc-macro2 = "1.0.107"
+quote = "1.0.47"
+syn = { version = "3.0.6", features = ["full"] }
+lino-objects-codec = "0.8.0"
diff --git a/lino-i18n-macros/src/lib.rs b/lino-i18n-macros/src/lib.rs
index 1a944ab..03781fb 100644
--- a/lino-i18n-macros/src/lib.rs
+++ b/lino-i18n-macros/src/lib.rs
@@ -25,7 +25,7 @@ use proc_macro::TokenStream;
 use proc_macro2::TokenStream as TokenStream2;
 use quote::quote;
 use syn::parse::{Parse, ParseStream};
-use syn::{parse_macro_input, LitStr, Token};
+use syn::{LitStr, Token, parse_macro_input};
 
 /// Arguments accepted by the macro:
 ///
@@ -66,7 +66,7 @@ impl Parse for MacroArgs {
                         format!(
                             "unknown argument `{other}` (expected `default`, `fallback`, or `compatibility_aliases`)"
                         ),
-                    ))
+                    ));
                 }
             }
         }
diff --git a/lino-i18n/Cargo.toml b/lino-i18n/Cargo.toml
index 24bbefb..0ffc95f 100644
--- a/lino-i18n/Cargo.toml
+++ b/lino-i18n/Cargo.toml
@@ -20,5 +20,5 @@ default = ["macros"]
 macros = ["dep:lino-i18n-macros"]
 
 [dependencies]
-lino-objects-codec = "0.2.1"
+lino-objects-codec = "0.8.0"
 lino-i18n-macros = { version = "0.3.0", path = "../lino-i18n-macros", optional = true }
diff --git a/lino-i18n/examples/basic.rs b/lino-i18n/examples/basic.rs
index 7ec9424..24b9437 100644
--- a/lino-i18n/examples/basic.rs
+++ b/lino-i18n/examples/basic.rs
@@ -4,7 +4,7 @@
 
 use std::sync::OnceLock;
 
-use lino_i18n::{i18n, I18n, TOptions};
+use lino_i18n::{I18n, TOptions, i18n};
 
 fn catalog() -> &'static I18n {
     static C: OnceLock<I18n> = OnceLock::new();
diff --git a/lino-i18n/src/i18n.rs b/lino-i18n/src/i18n.rs
index 94768e3..d16505b 100644
--- a/lino-i18n/src/i18n.rs
+++ b/lino-i18n/src/i18n.rs
@@ -6,8 +6,8 @@ use std::sync::Arc;
 
 use crate::format::interpolate;
 use crate::loader::{
-    compatibility_aliases_for_key, load_lino_catalogs, load_lino_directory, parse_lino_catalogs,
-    CompatibilityAlias, LoaderError,
+    CompatibilityAlias, LoaderError, compatibility_aliases_for_key, load_lino_catalogs,
+    load_lino_directory, parse_lino_catalogs,
 };
 use crate::plurals::plural_suffix;
 
diff --git a/lino-i18n/src/lib.rs b/lino-i18n/src/lib.rs
index 055061c..eb3029d 100644
--- a/lino-i18n/src/lib.rs
+++ b/lino-i18n/src/lib.rs
@@ -45,11 +45,11 @@ mod plurals;
 pub use format::interpolate;
 pub use i18n::{I18n, MissingKeyHandler, TOptions};
 pub use loader::{
-    expand_compatibility_aliases, format_lino_catalog, load_lino_catalog, load_lino_catalogs,
-    load_lino_directory, parse_lino_catalog, parse_lino_catalogs, Catalogue, CompatibilityAlias,
-    LoaderError,
+    Catalogue, CompatibilityAlias, LoaderError, expand_compatibility_aliases, format_lino_catalog,
+    load_lino_catalog, load_lino_catalogs, load_lino_directory, parse_lino_catalog,
+    parse_lino_catalogs,
 };
-pub use plurals::{plural_category, plural_suffix, PluralCategory};
+pub use plurals::{PluralCategory, plural_category, plural_suffix};
 
 #[cfg(feature = "macros")]
 pub use lino_i18n_macros::i18n;
diff --git a/lino-i18n/tests/integration.rs b/lino-i18n/tests/integration.rs
index 63f085e..9be74bd 100644
--- a/lino-i18n/tests/integration.rs
+++ b/lino-i18n/tests/integration.rs
@@ -3,7 +3,7 @@
 
 use std::sync::OnceLock;
 
-use lino_i18n::{i18n, parse_lino_catalog, I18n, TOptions};
+use lino_i18n::{I18n, TOptions, i18n, parse_lino_catalog};
 
 fn macro_catalog() -> &'static I18n {
     static C: OnceLock<I18n> = OnceLock::new();
```

Optional: `syn = { version = "3.0.6", features = ["full"] }` could become `syn = "3.0.6"`
(the macro parses only literals/idents; it builds without `full`), but `links-notation-macro`
already enables syn features in the same graph, so there is no build-time gain while the codec
dependency stays.

## 5. rust-script helpers: verified diff (ureq 3 / toml 1)

Before migration, bumping only the manifests gives (rust-script 0.36.0, rustc 1.98.1):

```
error[E0599]: no method named `timeout` found for struct `RequestBuilder<B>`   registry-state.rs:22
error[E0599]: no variant … named `Status` found for enum `ureq::Error`          registry-state.rs:31
error[E0277]: the size for values of type `str` cannot be known …              registry-state.rs:29 (into_string)
… same at check-release-needed.rs:112,117,132,145,185,191,226 and version-and-commit.rs:286,292,326
```

`check-version-modification.rs` **compiles** with toml 1 but fails at runtime: with the
unchanged code `"[workspace.package]\nversion = \"0.3.0\"\n…".parse::<toml::Value>()` returns
`TOML parse error at line 1, column 20`, whereas toml 0.8 parsed it as a table
(probe `/tmp/research-tools/probe-toml.rs`). In CI this would turn every PR that modifies any
`Cargo.toml` (e.g. this dependency PR) into a failure of the version-modification check. A
regression test was added; it fails on the old code (`panicked … versions(manifest).expect`)
and passes with `toml::Table`.

Verification: `rust-script --test` on all 15 top-level scripts passes (ureq/toml ones on
1.98.1 and 1.99.0); `rustfmt --edition 2021 --check` clean; runtime probe
(`/tmp/research-tools/probe-ureq3.rs`) against live endpoints:

```
lino-i18n@0.3.0 exists: true
lino-i18n@99.0.0 exists: false
crate list: Ok(200 OK) eq200=true
missing crate: Err(StatusCode(404)) matched
gh release missing: Err(StatusCode(404)) matched
gh release present: Ok(200 OK) eq200=true
dockerhub missing tag: Err(StatusCode(404)) matched
```

and an end-to-end run of the migrated
`rust-script check-release-needed.rs --rust-root <copy> --tag-prefix rust-v` printed
`max_published_version=0.3.0`, `published_crates=lino-i18n,lino-i18n-macros`,
`github_release_published=true`, `should_release=false` (correct for current state).

```diff
diff --git a/check-release-needed.rs b/check-release-needed.rs
index d7c0e48..3155eee 100644
--- a/check-release-needed.rs
+++ b/check-release-needed.rs
@@ -37,7 +37,7 @@
 //! ```cargo
 //! [dependencies]
 //! regex = "1"
-//! ureq = "2"
+//! ureq = "3"
 //! serde = { version = "1", features = ["derive"] }
 //! serde_json = "1"
 //! ```
@@ -109,12 +109,14 @@ fn check_docker_hub_tag(image: &str, version: &str) -> bool {
     );
 
     match ureq::get(&url)
-        .timeout(std::time::Duration::from_secs(15))
-        .set("User-Agent", "rust-script-check-release")
+        .config()
+        .timeout_global(Some(std::time::Duration::from_secs(15)))
+        .build()
+        .header("User-Agent", "rust-script-check-release")
         .call()
     {
         Ok(response) => response.status() == 200,
-        Err(ureq::Error::Status(404, _)) => false,
+        Err(ureq::Error::StatusCode(404)) => false,
         Err(e) => {
             eprintln!("::error::Docker Hub state is unknown: {e}");
             exit(1)
@@ -129,20 +131,22 @@ fn check_github_release(repository: &str, tag_prefix: &str, version: &str) -> bo
     );
 
     let mut request = ureq::get(&url)
-        .timeout(std::time::Duration::from_secs(15))
-        .set("User-Agent", "rust-script-check-release")
-        .set("Accept", "application/vnd.github+json");
+        .config()
+        .timeout_global(Some(std::time::Duration::from_secs(15)))
+        .build()
+        .header("User-Agent", "rust-script-check-release")
+        .header("Accept", "application/vnd.github+json");
 
     if let Ok(token) = env::var("GITHUB_TOKEN") {
         if !token.is_empty() {
             let auth_header = format!("Bearer {}", token);
-            request = request.set("Authorization", &auth_header);
+            request = request.header("Authorization", &auth_header);
         }
     }
 
     match request.call() {
         Ok(response) => response.status() == 200,
-        Err(ureq::Error::Status(404, _)) => false,
+        Err(ureq::Error::StatusCode(404)) => false,
         Err(e) => {
             eprintln!("::error::GitHub release state is unknown: {e}");
             exit(1)
@@ -182,13 +186,15 @@ fn get_max_published_version(crate_name: &str) -> Option<String> {
     let url = format!("https://crates.io/api/v1/crates/{}", crate_name);
 
     match ureq::get(&url)
-        .timeout(std::time::Duration::from_secs(15))
-        .set("User-Agent", "rust-script-check-release")
+        .config()
+        .timeout_global(Some(std::time::Duration::from_secs(15)))
+        .build()
+        .header("User-Agent", "rust-script-check-release")
         .call()
     {
         Ok(response) => {
             if response.status() == 200 {
-                if let Ok(body) = response.into_string() {
+                if let Ok(body) = response.into_body().read_to_string() {
                     if let Ok(data) = serde_json::from_str::<CratesIoCrate>(&body) {
                         if let Some(versions) = data.versions {
                             let mut max_version: Option<(u32, u32, u32, String)> = None;
@@ -223,7 +229,7 @@ fn get_max_published_version(crate_name: &str) -> Option<String> {
             eprintln!("::error::Crates.io version list metadata is unreadable or malformed");
             exit(1)
         }
-        Err(ureq::Error::Status(404, _)) => None,
+        Err(ureq::Error::StatusCode(404)) => None,
         Err(e) => {
             eprintln!("::error::Crates.io version state is unknown: {e}");
             exit(1)
diff --git a/check-version-modification.rs b/check-version-modification.rs
index 4fdd89e..540cd86 100644
--- a/check-version-modification.rs
+++ b/check-version-modification.rs
@@ -2,7 +2,7 @@
 //! Compare package/workspace versions semantically, including member manifests.
 //! ```cargo
 //! [dependencies]
-//! toml = "0.8"
+//! toml = "1"
 //! ```
 use std::{env, process::exit};
 #[path = "git-changes.rs"]
@@ -10,7 +10,7 @@ use std::{env, process::exit};
 mod git_changes;
 
 fn versions(text: &str) -> Result<(Option<toml::Value>, Option<toml::Value>), String> {
-    let document: toml::Value = text.parse::<toml::Value>().map_err(|e| e.to_string())?;
+    let document: toml::Table = text.parse::<toml::Table>().map_err(|e| e.to_string())?;
     let package = document
         .get("package")
         .and_then(|v| v.get("version"))
@@ -50,3 +50,22 @@ fn main() {
     }
     println!("Package and workspace versions are unchanged.");
 }
+
+#[cfg(test)]
+mod tests {
+    use super::versions;
+
+    #[test]
+    fn reads_package_and_workspace_versions_from_a_manifest() {
+        let manifest = "[workspace.package]\nversion = \"0.3.0\"\n\n[package]\nname = \"x\"\nversion = \"1.2.3\"\n";
+        let (package, workspace) = versions(manifest).expect("a Cargo.toml document parses");
+        assert_eq!(
+            package.as_ref().and_then(toml::Value::as_str),
+            Some("1.2.3")
+        );
+        assert_eq!(
+            workspace.as_ref().and_then(toml::Value::as_str),
+            Some("0.3.0")
+        );
+    }
+}
diff --git a/publish-crate.rs b/publish-crate.rs
index 8c4e28c..dc92fb5 100644
--- a/publish-crate.rs
+++ b/publish-crate.rs
@@ -20,7 +20,7 @@
 //! ```cargo
 //! [dependencies]
 //! regex = "1"
-//! ureq = "2"
+//! ureq = "3"
 //! serde_json = "1"
 //! ```
 
diff --git a/registry-state.rs b/registry-state.rs
index f40b6ca..1a96f36 100644
--- a/registry-state.rs
+++ b/registry-state.rs
@@ -19,16 +19,19 @@ pub fn version_exists(crate_name: &str, version: &str) -> bool {
         eprintln!("Reading anonymous version metadata: {url}");
     }
     let state = match ureq::get(&url)
-        .timeout(std::time::Duration::from_secs(15))
-        .set("User-Agent", "lino-i18n-release")
+        .config()
+        .timeout_global(Some(std::time::Duration::from_secs(15)))
+        .build()
+        .header("User-Agent", "lino-i18n-release")
         .call()
     {
         Ok(response) if response.status() == 200 => response
-            .into_string()
+            .into_body()
+            .read_to_string()
             .map_err(|error| error.to_string())
             .and_then(|body| parse_version(&body, version)),
         Ok(response) => Err(format!("Unexpected HTTP {}", response.status())),
-        Err(ureq::Error::Status(404, _)) => Ok(false),
+        Err(ureq::Error::StatusCode(404)) => Ok(false),
         Err(error) => Err(error.to_string()),
     };
     state.unwrap_or_else(|error| {
diff --git a/version-and-commit.rs b/version-and-commit.rs
index 3071bb2..29a2b4f 100644
--- a/version-and-commit.rs
+++ b/version-and-commit.rs
@@ -18,7 +18,7 @@
 //! [dependencies]
 //! regex = "1"
 //! chrono = "0.4"
-//! ureq = "2"
+//! ureq = "3"
 //! serde = { version = "1", features = ["derive"] }
 //! serde_json = "1"
 //! ```
@@ -283,13 +283,15 @@ fn check_version_on_crates_io(crate_name: &str, version: &str) -> bool {
 fn get_max_published_version(crate_name: &str) -> Option<(u32, u32, u32)> {
     let url = format!("https://crates.io/api/v1/crates/{}", crate_name);
     match ureq::get(&url)
-        .timeout(std::time::Duration::from_secs(15))
-        .set("User-Agent", "rust-script-version-and-commit")
+        .config()
+        .timeout_global(Some(std::time::Duration::from_secs(15)))
+        .build()
+        .header("User-Agent", "rust-script-version-and-commit")
         .call()
     {
         Ok(response) => {
             if response.status() == 200 {
-                if let Ok(body) = response.into_string() {
+                if let Ok(body) = response.into_body().read_to_string() {
                     if let Ok(data) = serde_json::from_str::<CratesIoCrate>(&body) {
                         if let Some(versions) = data.versions {
                             let mut max: Option<(u32, u32, u32)> = None;
@@ -323,7 +325,7 @@ fn get_max_published_version(crate_name: &str) -> Option<(u32, u32, u32)> {
             eprintln!("::error::Crates.io version list metadata is unreadable or malformed");
             exit(1)
         }
-        Err(ureq::Error::Status(404, _)) => None,
+        Err(ureq::Error::StatusCode(404)) => None,
         Err(error) => {
             eprintln!("::error::Crates.io state is unknown: {error}");
             exit(1);
diff --git a/wait-for-crate.rs b/wait-for-crate.rs
index 73d29d5..79a44ac 100644
--- a/wait-for-crate.rs
+++ b/wait-for-crate.rs
@@ -20,7 +20,7 @@
 //! ```cargo
 //! [dependencies]
 //! regex = "1"
-//! ureq = "2"
+//! ureq = "3"
 //! serde_json = "1"
 //! ```
 
```

Note: `publish-crate.rs` and `wait-for-crate.rs` need only the manifest bump — all their ureq
code lives in the shared `registry-state.rs`.

Other script deps (`regex = "1"`, `serde = "1"`, `serde_json = "1"`, `chrono = "0.4"`,
`walkdir = "2"`) are caret ranges with no lockfile; rust-script already resolves the latest
(regex 1.13.1, serde 1.0.229, serde_json 1.0.151, chrono 0.4.45, walkdir 2.5.0). Raising
the floors (e.g. `regex = "1.13"`) is cosmetic. Scripts run as edition 2021 under
rust-script 0.36.0 (latest); adding `[package] edition = "2024"` to each cargo block is
optional and was not tested.

## 6. Can lino-objects-codec 0.8 replace hand-rolled code?

No, not without changing the catalogue format:

- `rust/lino-i18n/src/loader.rs:257-310` (`find_closing_quote`, `unescape_value`,
  `escape_value`) implement **backslash escapes** (`\n`, `\r`, `\t`, `\\`, `\"`).
  codec 0.8's new `format::{quote, format_value_single_line, format_value_verbatim, unescape}`
  (`rust/src/format.rs:6`, `readable.rs:153,159,364,840`) use Links Notation quote-run rules
  (`"""say "hi""""`) and percent-escaped `(escaped "…")` payloads. Swapping would change how
  existing `.lino` catalogues with `\"` or `\n` decode — a format break shared with the JS side.
- `loader.rs:312-362` (`parse_triple_quoted_value`, `parse_quoted_value`) and
  `loader.rs:364-583` (logical lines, locale trees, selector-group flattening, label aliases)
  are i18n-specific; codec's `format::parse_indented` (`format.rs:253`) still returns a flat
  `(String, HashMap<String,String>)` for one block only — the same limitation that caused its
  removal in `d32cd24`.
- `loader.rs:598-615` `format_value` emits `"""` blocks for multiline values;
  `format_value_verbatim` would emit a different quoting form.
- `rust/lino-i18n/src/i18n.rs` (resolver, plurals, fallbacks) and
  `rust/lino-i18n-macros/src/lib.rs:219-231` (`first_locale_in_text`) have no codec counterpart.
- The new optional `json` feature (`serde_json::Value` bridge) is irrelevant here.

Recommendation: bump to 0.8.0 (keeps R4); a future issue could decide whether to drop the
unused dependency or align the escape syntax with Links Notation in both JS and Rust.

## 7. Security audit

`cargo-audit 0.22.2` is the latest release (crates.io `max_stable_version`, 2026-06-05;
MSRV 1.88). Using the prebuilt binary
`/tmp/cargo-audit-dl/cargo-audit-x86_64-unknown-linux-musl-v0.22.2/cargo-audit`
with the RustSec DB (1294 advisories):

- upgraded workspace lock: `Scanning Cargo.lock for vulnerabilities (12 crate dependencies)` — 0 findings;
- rust-script lockfiles generated from the migrated scripts
  (`~/.cache/rust-script/projects/<hash>/Cargo.lock`): publish-crate (57 crates, ureq 3.4.2),
  check-release-needed (57), version-and-commit (83), check-version-modification (16, toml 1.1.7)
  — all `--deny warnings` clean.

## 8. Commands used

```bash
grep -rn 'lino_objects_codec\|syn::\|ureq\|toml::' --include=*.rs rust/
git log --oneline -S 'lino_objects_codec' -- rust
gh api repos/link-foundation/lino-objects-codec/contents/rust/CHANGELOG.md --jq .content | base64 -d
gh release view 3.0.0 --repo dtolnay/syn
gh api repos/algesten/ureq/contents/MIGRATE-2-to-3.md --jq .content | base64 -d
gh api repos/toml-rs/toml/contents/crates/toml/CHANGELOG.md --jq .content | base64 -d
curl -s -A research https://crates.io/api/v1/crates/<name>/<version>   # rust_version
# workspace (copy)
sed -i ... Cargo.toml; cargo update; cargo fix --edition --all-targets --allow-dirty
cargo fmt --all; cargo build/test/clippy (stable, +1.87.0, +1.99.0); cargo +1.84.0/+1.85.0/+1.86.0 build
rm Cargo.lock && cargo generate-lockfile
# scripts (copy)
cargo install rust-script --version 0.36.0 --locked
rust-script --test <script>.rs
cargo-audit audit --file <Cargo.lock> --deny warnings
```

## 9. Reconciliation with the branch HEAD (`cb27f42`)

The branch commits `b6047f7 build(rust): update all crates to latest, Rust 2024 edition, MSRV 1.87`
and `1007a72 build(rust): move rust-script helpers to ureq 3 and toml 1` already contain the
changes researched above (the "Current" column in the TL;DR refers to the pre-PR base). Checked with
`git show HEAD:<file>`:

- `rust/Cargo.toml`: `edition = "2024"`, `rust-version = "1.87"` — matches. **`resolver` is still
  `"2"`**; recommend `"3"` (edition 2024 default, MSRV-aware; verified to change nothing in the lock).
- `rust/lino-i18n-macros/Cargo.toml`: proc-macro2 1.0.107, quote 1.0.47, syn 3.0.6 `full`,
  lino-objects-codec 0.8.0 — matches. `rust/lino-i18n/Cargo.toml:23` codec 0.8.0 — matches.
- `rust/Cargo.lock`: `version = 4`, syn 3.0.6, links-notation 0.23.0, codec 0.8.0 — matches.
- `rust/scripts/registry-state.rs:21-34`: ureq 3 form with `response.body_mut().read_to_string()`
  (equivalent to the `into_body()` form used in section 5) — matches.
- `rust/scripts/check-version-modification.rs:13` uses `text.parse::<toml::Table>()` and has a
  regression test (`reads_package_and_workspace_versions_from_whole_manifests`, which also asserts a
  malformed manifest errors) — matches and supersedes the test in section 5.
