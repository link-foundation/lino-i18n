# lino-i18n

[![JavaScript CI/CD](https://github.com/link-foundation/lino-i18n/actions/workflows/js.yml/badge.svg?branch=main)](https://github.com/link-foundation/lino-i18n/actions/workflows/js.yml)
[![Rust CI/CD](https://github.com/link-foundation/lino-i18n/actions/workflows/rust.yml/badge.svg?branch=main)](https://github.com/link-foundation/lino-i18n/actions/workflows/rust.yml)
[![npm](https://img.shields.io/npm/v/lino-i18n?label=npm)](https://www.npmjs.com/package/lino-i18n)
[![Crates.io](https://img.shields.io/crates/v/lino-i18n?label=crates.io)](https://crates.io/crates/lino-i18n)
[![Docs.rs](https://docs.rs/lino-i18n/badge.svg)](https://docs.rs/lino-i18n)
[![GitHub Release](https://img.shields.io/github/v/release/link-foundation/lino-i18n?include_prereleases&label=release)](https://github.com/link-foundation/lino-i18n/releases)

A universal internationalization (i18n) library that stores translations in
[Links Notation](https://github.com/linksplatform/Protocols.Lino) (`.lino`) instead
of JSON or YAML.

The repository ships two implementations and a CLI:

| Path                      | What it is                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| [`js/`](./js)             | The `lino-i18n` JavaScript package (Node.js, Bun, Deno, browsers).                             |
| [`js/bin/lino-i18n.js`](./js/bin) | A converter CLI that turns `i18next`, `i18n-js`, and `react-intl` catalogues into `.lino`. |
| [`rust/`](./rust)         | The `lino-i18n` Rust crate plus the `lino-i18n-macros` companion (`i18n!` compile-time macro). |

Both implementations consume the **same** `.lino` files. They share nested
catalogue authoring, plural categories, placeholder syntax, context suffixes,
multiline strings, bundled locale files, and fallback semantics, so a catalogue
you author once works in either runtime.

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
  telegram
    help
      title "Help"
      solve
        alias
          detail "Tool aliases imply `--tool <tool>`"
  prompt
    system
      general
        guidelines
          header "General guidelines."
          body """
            When you start, create a detailed plan for yourself.
            Follow your todo list step by step.
          """
  error
    label "Error"
    invalid
      github
        url "Error: Invalid GitHub URL format"
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

The loader flattens that catalogue to runtime keys like
`telegram.help.solve.alias.detail`,
`prompt.system.general.guidelines.body`, `error.label`,
`error.invalid.github.url`, `cart.items_one`, and `role_female`, so deeply
nested authoring still resolves stable flat runtime keys.

A nested group's `label` child is also exposed as the parent key, so
`error.label` and `error` both resolve to `"Error"` while an explicit `error`
entry still takes precedence. The Hive Mind migration that motivated this
pattern is summarized in
[docs/case-studies/issue-12](./docs/case-studies/issue-12).

### Migration aliases

Projects that migrate older mixed dot/underscore keys to deeper `.lino`
nesting can opt into generated compatibility aliases:

```js
const catalogues = await loadLocalesFromDirectory('./locales', {
  compatibilityAliases: ['collapseTail', 'parentLabel'],
});
const i18n = createI18n({ locales: catalogues, defaultLocale: 'en' });
```

With `collapseTail`, a canonical key such as
`telegram.help.solve.alias.detail` also exposes
`telegram.help_solve_alias_detail`, `telegram.help.solve_alias_detail`, and
`telegram.help.solve.alias_detail`. With `parentLabel`, `error.label` also
exposes `error`. Explicit catalogue entries always win over generated aliases.

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
import { loadLocalesFromDirectory } from 'lino-i18n/loaders';

const catalogues = await loadLocalesFromDirectory('./locales');
const i18n = createI18n({
  locales: catalogues,
  defaultLocale: 'en',
  fallback: ['en'],
});

i18n.t('greeting', { name: 'World' });              // → "Hello, World!"
i18n.t('cart.items', { count: 0 });                 // → "Your cart is empty"
i18n.t('cart.items', { count: 3 }, { locale: 'ru' }); // → "3 товара"
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
time, embeds the catalogue text, and builds the `(key → value)` tables when
the `I18n` value is initialized. Each file is tracked through `include_str!`,
so Cargo rebuilds when any catalogue changes.

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

# Bundle several locales into one .lino file
npx lino-i18n convert --from i18next \
  --in locales-json --out locales --single-file all.lino
```

Run `npx lino-i18n --help` for the full option list.

## Feature comparison

| Feature                           | i18next | i18n-js | react-intl | **lino-i18n**           |
| --------------------------------- | :-----: | :-----: | :--------: | :---------------------: |
| Text-friendly catalogue format    |    ✗    |    ~    |     ✗      | **✓** (`.lino`)         |
| Nested authoring format           |    ✓    |    ✓    |     ~      | **✓**                   |
| Plural categories (CLDR)          |    ✓    |    ✓    |     ✓      | **✓**                   |
| Placeholder interpolation         |    ✓    |    ✓    |     ✓      | **✓** (`{{x}}` & `{x}`) |
| Context / gender suffixes         |    ✓    |    ~    |     ✗      | **✓**                   |
| Namespaces                        |    ✓    |    ✓    |     ✗      | **✓**                   |
| Fallback locales                  |    ✓    |    ✓    |     ~      | **✓**                   |
| Missing-key handler               |    ✓    |    ~    |     ~      | **✓**                   |
| First-class JS API                |    ✓    |    ✓    |     ✓      | **✓**                   |
| Optional React provider + hooks   |    ✓    |    ~    |     ✓      | **✓** (`lino-i18n/react`) |
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
    ├── js.yml                     # JS CI/CD, npm release, and docs deployment
    ├── rust.yml                   # Rust fmt+clippy+test matrix and release
    ├── workflows.yml              # Workflow syntax, security, and policy
    ├── security.yml               # Dependency audits and CodeQL
    └── docs.yml                   # Documentation and live link validation
```

## CI

Five workflows live in `.github/workflows/`:

- **`js.yml`** checks syntax, formatting, lint, duplication, secrets, types,
  browser behavior, and the Node/Bun/Deno matrix on Linux, macOS, and Windows.
  It also tests CLI conversion and npm package contents. Main releases use npm
  Trusted Publishing and `js-v*` GitHub releases. Keep this filename aligned
  with the npm trusted publisher configuration.
- **`rust.yml`** checks formatting, Clippy, every executable Rust CI script
  and its unit tests, the workspace test matrix, and both crate packages.
  Main releases publish the macros crate before the runtime and create
  `rust-v*` GitHub releases.
- **`workflows.yml`** runs actionlint with ShellCheck, zizmor, and repository
  policy checks, including terminal status coverage and writer cancellation.
- **`security.yml`** audits the committed npm and Cargo lockfiles on PRs,
  main, and a weekly schedule; it also runs dependency review and CodeQL.
- **`docs.yml`** validates required documentation, builds both sites, and
  verifies product links. Transient failures are rechecked; archived case
  studies and investigation data are excluded from live-link validation.

Read-only checks cancel superseded work. Release and deployment jobs share one
repository-wide queue with `queue: max`, preserving pending jobs and letting
started jobs finish. Writers synchronize a clean,
validated checkout before changing versions and reject untested source drift.
Both Pages jobs publish the complete site: JavaScript at the root and Rust
under `/rust/`, so a language deployment cannot erase the other site's docs.

Registry verification is anonymous and separate from publishing. Once npm
accepts a version, CI polls for visibility rather than publishing it again.
A staged version can require a maintainer to inspect `npm stage list` and
approve its stage ID with 2FA. If direct publishing is intended, configure
that permission in npm's trusted publisher settings. CI reports this state
and cannot approve a staged version through OIDC.

The JavaScript tooling uses Node 24 and the committed npm lockfile in every
runtime job; the package's supported runtime range is Node 22.11 or newer.
CI runs the test matrix on Node 22, 24 and 26.
Duplication scanning uses jscpd's JavaScript/TypeScript/shell formats, fails
when no files are scanned, and enforces the templates' 10% threshold.

Set `DEBUG=1` when running the change detectors or release helpers to show
comparison refs and registry lookup states. For terminal cancellation
classification, use `PIPELINE_STATUS_VERBOSE=1`. Both modes default off.
The issue 23 [investigation and reproducible evidence](dev/log/issues/23/pulls/24/ANALYSIS.md)
records the historical failures, template comparison, and verification.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Add a JavaScript changeset in `js/.changeset/` and/or a Rust fragment in
   `rust/changelog.d/`; CI owns package version updates.
4. Make your changes — keep `js/` and `rust/` behaviour consistent.
5. Open a pull request.

Install the development dependencies and enable the optional local hook:

```bash
(cd js && npm ci)
git config core.hooksPath .githooks
```

Before committing, run `(cd js && npm run check && npm test && npm run test:types)`
and `cargo test --locked --manifest-path rust/Cargo.toml --workspace --all-targets`.
The hook also checks secrets, file limits, formatting, and Clippy for changed
languages. Python 3.11 or newer is required for the shared release checks;
install `scripts/requirements-ci.txt` to run workflow policy checks locally.
Both implementations must pass their CI matrix before a PR can land.

## License

Released into the public domain under the [Unlicense](LICENSE). Use this
library, fork it, vendor it, or strip the attribution — there is no
restriction.
