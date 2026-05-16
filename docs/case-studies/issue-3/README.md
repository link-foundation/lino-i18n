# Case Study: Issue #3 - Nested i18n Authoring UX

## Issue Overview

**Issue:** [link-foundation/lino-i18n#3](https://github.com/link-foundation/lino-i18n/issues/3)<br>
**Title:** Better hero example, and core features of UX<br>
**Status:** Open at research time<br>
**Prepared PR:** [#4](https://github.com/link-foundation/lino-i18n/pull/4)

The issue asks for a more readable default authoring experience for `.lino`
translation catalogues. The motivating example contrasts flat keys such as
`cart.items_one` with nested content blocks:

```lino
en
  greeting "Hello, {{name}}!"
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

## Requirements

1. Support nested categories by default for readable `.lino` catalogues.
2. Preserve runtime compatibility with existing dot keys, plural suffixes, and
   context suffixes.
3. Support multiline quoted statements in tests and examples.
4. Support per-language files such as `en.lino` and `ru.lino`.
5. Support bundled files with several top-level locale blocks.
6. Provide a custom configuration path for conversion workflows.
7. Keep JavaScript and Rust behaviour aligned.
8. Compile repository and issue-specific research into this folder.

## Repository Findings

- The JavaScript loader previously delegated catalogue parsing to
  `lino-objects-codec.parseIndented` and then treated only direct key/value
  entries as translations.
- The Rust loader used `lino_objects_codec::format::parse_indented`, whose
  public API returns a flat `HashMap<String, String>`.
- Both runtime resolvers already expected flat keys for lookup:
  `cart.items_one`, `cart.items_other`, `role_female`.
- The missing layer was therefore not resolver logic, but a catalogue
  authoring adapter that maps nested content blocks to the existing flat
  runtime contract.
- The previous `docs/case-studies/issue-3` content was inherited from another
  repository's unrelated issue #3, so it was replaced with current data.

## External References

- [i18next plurals](https://www.i18next.com/translation-function/plurals) use
  plural suffix keys including `_zero`, `_one`, and `_other`, with `_zero` as a
  special natural-language override.
- [i18next configuration](https://www.i18next.com/overview/configuration-options)
  documents fallback behaviour and notes that nested and flat key lookup can
  both be relevant in translation catalogues.
- [ICU PluralFormat](https://unicode-org.github.io/icu-docs/apidoc/dev/icu4j/com/ibm/icu/text/PluralFormat.html)
  identifies the CLDR plural categories `zero`, `one`, `two`, `few`, `many`,
  and `other`.
- [ICU MessageFormat guide](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
  motivates keeping full translated messages together so localizers can choose
  complete sentence structure.
- [lino-objects-codec](https://www.npmjs.com/package/lino-objects-codec) already
  positions readable indented Links Notation as a reviewable format for nested
  JSON-style objects, which matches the desired authoring direction.

## Solution Plan

### Parser and Formatter

Implement an i18n-specific nested `.lino` parser in both JavaScript and Rust:

- Top-level blocks are locales.
- Nested blocks flatten with dot notation.
- Selector groups flatten with underscore suffixes when all children are known
  plural/context selectors:
  `zero`, `one`, `two`, `few`, `many`, `other`, `male`, `female`, `neutral`.
- Triple-quoted strings preserve multiline content.
- Existing flat keys remain accepted.

The formatter should emit nested syntax by default while preserving a flat
style option in JavaScript for compatibility.

### File Layouts

Support both common catalogue layouts:

```text
locales/
  en.lino
  ru.lino
```

and bundled files:

```lino
en
  greeting "Hello"

ru
  greeting "Привет"
```

Directory loaders merge all `*.lino` files and all top-level locale blocks.

### CLI UX

Extend conversion with:

- `--single-file <name>` to write all converted locales into one bundled
  `.lino` file.
- `--config <path>` to read command defaults from JSON, for example:

```json
{
  "convert": {
    "in": "locales-json",
    "out": "locales",
    "from": "i18next",
    "singleFile": "all.lino"
  }
}
```

### Tests

Add reproducing tests for:

- Nested plural and context groups.
- Multiline quoted values.
- Multi-locale bundled `.lino` files.
- Directory loading that merges bundled and per-language files.
- CLI single-file bundle output.
- CLI JSON config defaults.
- Rust loader and macro consumption of nested catalogues.

## Implemented Changes

- JavaScript:
  - `parseLinoCatalogs` and `formatLinoCatalogs` were added.
  - `formatLinoCatalog` now emits nested syntax by default.
  - `loadLocalesFromDirectory` merges every top-level locale block in every
    `.lino` file.
  - `lino-i18n convert` supports `--single-file` and `--config`.
  - Type declarations were updated for the new APIs.
- Rust:
  - `parse_lino_catalogs` and `load_lino_catalogs` were added.
  - Directory and file loading support bundled multi-locale files.
  - `format_lino_catalog` emits nested syntax.
  - The `i18n!` macro embeds `.lino` text through `include_str!` and populates
    the runtime through the shared parser.
- Examples and docs:
  - Sample `en.lino` and `ru.lino` files now use nested syntax.
  - README examples include multiline hero text.
  - Package READMEs document nested authoring and bundled files.

## Data Files

- [`data/issue-3.json`](./data/issue-3.json) - Issue metadata captured from GitHub.
- [`data/pr-4.json`](./data/pr-4.json) - Prepared PR metadata.
- [`data/recent-merged-prs.json`](./data/recent-merged-prs.json) - Related
  repository PR context.
- [`data/link-foundation-parse-search.json`](./data/link-foundation-parse-search.json)
  - Link Foundation code search for related parser usage.
- [`data/repository-file-tree.txt`](./data/repository-file-tree.txt) - Local JS
  and Rust file tree at investigation time.

## Verification

Local verification for this PR should include:

```bash
cd js && npm test
cd rust && cargo test --all-targets
```

Before finalization, run formatting/lint checks for both stacks and inspect the
PR diff to confirm no unrelated features were removed.
