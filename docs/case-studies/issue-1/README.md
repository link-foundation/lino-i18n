# Case Study: Issue #1 — Universal i18n Library on Top of Links Notation

## Issue Reference

- **Issue**: [#1 — Make 0.0.1 version of universal i18n library, that uses Links Notation instead of any other format](https://github.com/link-foundation/lino-i18n/issues/1)
- **Author**: [@konard](https://github.com/konard)
- **Labels**: `documentation`, `enhancement`
- **Pull Request**: [#2 — Implementation of lino-i18n 0.0.1](https://github.com/link-foundation/lino-i18n/pull/2)

## Goal

Build a **universal i18n library**, in JavaScript and Rust, that uses the
**Links Notation** (`lino`) format for storing translation catalogues
instead of JSON/YAML/PO/properties. The library must:

- Match or surpass the features of the three reference libraries: `i18next`,
  `i18n-js`, and `react-intl`.
- Ship `CLI` converters that import existing translation catalogues from those
  three libraries into `.lino` files.
- Compile translations at compile-time in Rust via a procedural macro.
- Be released under the Unlicense (public domain) like the rest of the
  Link Foundation stack.
- Live in a single repository with `js/` and `rust/` folders at the root and
  language-specific GitHub Actions workflows (`js.yml`, `rust.yml`).

## Data Collected

The `data/` folder of this case study contains:

| File | Description |
| ---- | ----------- |
| `issue-1.json` | Raw issue body and metadata (saved via `gh issue view`). |
| `references.md` | Curated links to every external project mentioned in the issue plus version snapshots from registries. |
| `i18next-features.md` | Feature inventory of `i18next` (file formats, plurals, interpolation, namespaces, lazy loading, React bindings, etc.). |
| `i18n-js-features.md` | Feature inventory of `i18n-js`. |
| `react-intl-features.md` | Feature inventory of `react-intl` / FormatJS. |
| `lino-stack.md` | Notes on `links-notation`, `lino-objects-codec`, `lino-arguments`, including published versions and key API surfaces. |
| `hive-mind-i18n.mjs` | The reference implementation copied verbatim from `link-assistant/hive-mind` that proves the pattern works in production. |

## Requirements (Verbatim from Issue → Decomposed)

Below is every requirement extracted from the issue, indexed for easy
cross-reference. Each requirement is paired with a proposed solution and a
status indicator that points to where it lives in this pull request.

| ID | Requirement | Solution | Status |
| -- | ----------- | -------- | ------ |
| R1  | Ship version `0.0.1` of a universal i18n library | New `js/package.json` + `rust/Cargo.toml` both declare version `0.0.1` | ✅ Done |
| R2  | Use Links Notation as the only translation file format | All translations live in `*.lino` and are parsed via `lino-objects-codec` | ✅ Done |
| R3  | Use `links-notation` as a dependency | Declared in both `js/package.json` and `rust/Cargo.toml` | ✅ Done |
| R4  | Use `lino-objects-codec` as a dependency | Declared in both `js/package.json` and `rust/Cargo.toml` | ✅ Done |
| R5  | Use `lino-arguments` (or its concepts) for the CLI | JS CLI imports `lino-arguments`; Rust CLI uses the matching crate | ✅ Done |
| R6  | Convert from i18next JSON resources to lino | `lino-i18n convert --from i18next` | ✅ Done |
| R7  | Convert from i18n-js JSON to lino | `lino-i18n convert --from i18n-js` | ✅ Done |
| R8  | Convert from react-intl/FormatJS JSON to lino | `lino-i18n convert --from react-intl` | ✅ Done |
| R9  | Support all the best features expected from such libraries | See comparison table below; implemented features include interpolation, ICU plurals, namespaces, fallbacks, key separators, contexts, escape/safe-html, default values, and missing-key reporting | ✅ Done |
| R10 | Public Domain license | `LICENSE` already Unlicense; all new files inherit this license | ✅ Done |
| R11 | Detailed comparison table of i18next, i18n-js, react-intl, lino-i18n | See "Feature Comparison" section below and `data/*-features.md` | ✅ Done |
| R12 | Rust support with a compile-time macro that embeds translations | `lino_i18n_macros::translations!` proc-macro loads `.lino` at build time and emits typed const lookups | ✅ Done |
| R13 | Use best practices from `rust-ai-driven-development-pipeline-template` | Cargo workspace layout, `[lints.clippy]` block, `cargo test`, `cargo fmt`, `cargo clippy --all-targets`, MSRV 1.70 | ✅ Done |
| R14 | Have `rust/` and `js/` directories at the repository root | Both directories exist with their own README, src, tests, examples | ✅ Done |
| R15 | Have `rust.yml` and `js.yml` workflows under `.github/workflows/` | Both workflows exist and run tests per language | ✅ Done |
| R16 | Compile case-study data under `./docs/case-studies/issue-1/` | This very document plus `data/` folder | ✅ Done |
| R17 | Do deep case-study analysis including online research | Inventory of three reference libraries, plus survey of related Rust crates and existing i18n+lino work | ✅ Done |
| R18 | List every requirement from the issue | This table | ✅ Done |
| R19 | Propose solutions and plans for each requirement | This table + the "Solution Plan" section below | ✅ Done |
| R20 | Check known existing components / libraries that solve similar problems | See "Related Work" section | ✅ Done |
| R21 | Plan **and** execute everything in a single pull request | All work is shipped in PR #2 | ✅ Done |

## Feature Comparison

The comparison below is curated from each library's official documentation,
README, and source repositories (captured in `data/*-features.md`).

### Core Features

| Feature | i18next | i18n-js | react-intl (FormatJS) | **lino-i18n (this work)** |
| ------- | :-----: | :-----: | :-------------------: | :-----------------------: |
| Pluggable backends / loaders | ✅ (15+ backends) | ❌ (in-memory only) | ❌ (bundled at build) | ✅ filesystem + in-memory + custom |
| File format | JSON, YAML, PO, …  | JSON | JSON (ICU MessageFormat) | **Links Notation (`.lino`)** |
| Interpolation `{{var}}` | ✅ | ✅ (`%{var}`) | ✅ (ICU `{var}`) | ✅ (`{{var}}` + ICU `{var}` fallback) |
| Default value when key missing | ✅ | ✅ | ✅ | ✅ (`{ defaultValue: '…' }`) |
| Namespaces | ✅ (`ns:key`) | ❌ (scope only) | ❌ (single bundle) | ✅ (`ns:key`) |
| Nested keys | ✅ (`a.b.c`) | ✅ | ❌ | ✅ (`a.b.c` and `a/b/c`) |
| Pluralisation | ✅ (CLDR + count) | ✅ (CLDR + count) | ✅ (ICU select/plural) | ✅ (CLDR plurals via `Intl.PluralRules`) |
| Gender / context | ✅ (`_male`/`_female`) | ❌ | ✅ (ICU select) | ✅ (suffix-based context) |
| Fallback locale chain | ✅ | ✅ (single fallback) | ✅ (single fallback) | ✅ (array of fallbacks) |
| Locale detection (CLI/env) | via plugins | via app | via app | ✅ via `lino-arguments` |
| Lazy load locale on demand | ✅ | ❌ | ❌ | ✅ |
| Missing key handler | ✅ | ✅ | ✅ | ✅ (`onMissingKey` callback) |
| Format-specific helpers (date, number, currency) | via plugins | partial | ✅ (best-in-class via Intl.*) | ✅ (delegated to `Intl.DateTimeFormat`/`Intl.NumberFormat`) |
| React bindings | via `react-i18next` | via `i18n-js/react` (unofficial) | ✅ (`<FormattedMessage>`) | ✅ thin `useTranslation` hook |
| TypeScript types for keys | partial | ❌ | partial | ✅ generated via CLI |
| Compile-time embed | ❌ | ❌ | partial (precompile) | ✅ Rust proc-macro, JS bundler-ready |
| License | MIT | MIT | BSD-3 | **Unlicense (Public Domain)** |
| File-format diff readability | ⚠️ JSON noise | ⚠️ JSON noise | ⚠️ JSON noise | ✅ tiny diffs (Links Notation) |

### CLI / Tooling

| Tool | i18next | i18n-js | react-intl | **lino-i18n** |
| ---- | :-----: | :-----: | :--------: | :-----------: |
| Built-in CLI | `i18next` (parser) | `i18n-js` (CLI) | `formatjs` CLI | `lino-i18n` |
| Convert from i18next | — | — | — | ✅ |
| Convert from i18n-js | — | — | — | ✅ |
| Convert from react-intl | — | — | — | ✅ |
| Extract from source | ✅ | ✅ (Rails) | ✅ | _stretch goal_ |
| Format-check / lint | ❌ | ❌ | ✅ | ✅ (`lino-i18n check`) |
| Rust compile-time macro | ❌ | ❌ | ❌ | ✅ |

### Why Links Notation?

- **Smaller, line-oriented diffs**: a single translated string is a single
  line; reviewers see only the strings that changed instead of JSON brace
  noise around them.
- **Built for nesting**: namespaces and nested keys are free because
  Links Notation already represents hierarchies natively.
- **No quoting tax** for keys: keys without special characters do not need
  quotes; only the values do (and only when they contain whitespace).
- **Language-agnostic**: `links-notation` already ships in 6 languages
  (JS, Rust, C#, Python, Go, Java), so this i18n library can be ported
  to all of them later without rethinking the on-disk format.

## Solution Plan

The work is delivered as the following layers, each backed by the matching
tests inside the PR.

### Layer 1 – Translation file format

A `*.lino` file is the indented form of Links Notation as parsed by
`lino-objects-codec`'s `parseIndented`. The first identifier in the file is
the locale name, followed by indented `<key> "<value>"` pairs:

```lino
en
  greeting "Hello, {{name}}!"
  cart.items_zero "Your cart is empty"
  cart.items_one  "{{count}} item"
  cart.items_other "{{count}} items"
  navigation:home "Home"
  navigation:profile "Profile"
```

- Keys may use `.` for namespaces inside a flat translation table.
- Keys may use `ns:key` for explicit namespaces (when loading multiple
  namespaces from the same file).
- Plural variants follow the CLDR suffixes (`_zero`, `_one`, `_two`,
  `_few`, `_many`, `_other`).
- Context variants follow `key_context` (`role_male`, `role_female`).

### Layer 2 – JavaScript runtime (`js/src/index.js`)

- `createI18n({ locales, fallback, namespace, onMissingKey })` returns an
  instance with `t`, `setLocale`, `loadLocale`, `getLocale`, and
  `getFallbacks`.
- `loadLocaleFromFile(path)` parses a `.lino` file via
  `lino-objects-codec.parseIndented`.
- ICU-style `{var}` and i18next-style `{{var}}` both work.
- Pluralisation goes through `Intl.PluralRules`; gender via `_male` /
  `_female` etc. suffix.
- Fallback chain accepts an array; missing-key handler is callable.

### Layer 3 – CLI (`js/bin/lino-i18n.js`)

Built on `lino-arguments` for configuration handling:

- `lino-i18n convert --from <i18next|i18n-js|react-intl> --in <dir|file>
  --out <dir>` writes one `.lino` per locale.
- `lino-i18n check --dir <dir>` reports missing keys vs. the reference
  locale and key-format inconsistencies.
- `lino-i18n t --dir <dir> --locale <code> <key> [k=v ...]` translates from
  the CLI for quick debugging.

### Layer 4 – Rust runtime (`rust/src/lib.rs`)

- `LinoI18n` struct wraps a `HashMap<locale, HashMap<key, value>>`.
- `i18n.t(key)` and `i18n.t_args(key, &[("name", "Alice")])` perform
  interpolation; `i18n.t_plural(key, count)` selects the CLDR variant.
- `LinoI18n::from_lino_str(&str)` parses inline `.lino` content.

### Layer 5 – Rust compile-time macro (`rust/macros/`)

A proc-macro crate exposes `translations!("path/to/locales/")` which
walks the directory at compile time, parses every `.lino` file with
`lino-objects-codec`, and emits a `LinoI18n` populated with `static`
maps. Missing keys at compile time become compile errors.

### Layer 6 – CI

`.github/workflows/js.yml` runs `cd js && npm install && npm test` on
Node.js LTS. `.github/workflows/rust.yml` runs `cd rust && cargo test
--workspace && cargo clippy --all-targets`. Both workflows are triggered
on push / pull-request and only on changes inside their respective
directories.

## Related Work

| Project | What it does | Why we are not using it directly |
| ------- | ------------ | -------------------------------- |
| [`i18next`](https://www.i18next.com) | The de-facto JS i18n library | Big surface, JSON format, plugin model is overkill for 0.0.1 |
| [`i18n-js`](https://www.npmjs.com/package/i18n-js) | Ruby-on-Rails compatible JS translator | Locked to JSON, no compile-time story for Rust |
| [`react-intl`](https://www.npmjs.com/package/react-intl) | FormatJS-based React bindings | Heavy ICU dependency, BSD-3 (not Public Domain) |
| [`fluent-rs`](https://github.com/projectfluent/fluent-rs) | Mozilla Fluent for Rust | Different file format (FTL), not Links Notation |
| [`rust-i18n`](https://github.com/longbridgeapp/rust-i18n) | Rust macro that loads translations at build time | Inspiration for the macro design; locked to YAML/JSON |
| [`fluent-templates`](https://docs.rs/fluent-templates) | Compile-time embedding of FTL | Inspiration for `embed!` style macros |
| [`unic-langid`](https://docs.rs/unic-langid) | Language identifier parsing | Future improvement: use for stricter locale parsing |
| [`link-assistant/hive-mind`](https://github.com/link-assistant/hive-mind/blob/main/src/i18n.lib.mjs) | Production code from the same author using `.lino` for i18n | Direct inspiration; behaviour is generalised here |

## Acceptance Checklist

- [x] Case study compiled under `docs/case-studies/issue-1/`.
- [x] Comparison table covers i18next, i18n-js, react-intl, and the new
      library.
- [x] `js/` package builds and tests pass with Node 20+.
- [x] `rust/` workspace builds and tests pass with Rust 1.70+.
- [x] `lino-i18n convert` round-trips all three reference formats.
- [x] CI workflows `js.yml` and `rust.yml` execute per-language.
- [x] All new code released under the Unlicense.
