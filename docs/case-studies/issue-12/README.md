# Case Study: Issue #12 - Hive Mind Deep Catalogue Style

## Issue Overview

**Issue:** [link-foundation/lino-i18n#12](https://github.com/link-foundation/lino-i18n/issues/12)<br>
**Title:** Add a real-world deeply nested catalogue example from Hive Mind<br>
**Prepared PR:** [#15](https://github.com/link-foundation/lino-i18n/pull/15)

Hive Mind adopted `lino-i18n` in
[link-assistant/hive-mind#1816](https://github.com/link-assistant/hive-mind/pull/1816)
and then applied review feedback to group every existing translation more
deeply. As of May 17, 2026, that Hive Mind PR is open and keeps local
compatibility aliases while upstream parent-label and old-key alias support are
tracked here.

## Production Shape

The migration showed that the default `.lino` authoring style should handle
operational UI text, bot help text, and long prompt instructions without
repeating prefixes:

```lino
en
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
```

The current JS and Rust loaders flatten that catalogue to canonical runtime
keys:

```txt
telegram.help.title
telegram.help.solve.alias.detail
prompt.system.general.guidelines.header
prompt.system.general.guidelines.body
error.label
error.invalid.github.url
```

That keeps `.lino` files readable for reviewers while preserving stable lookup
keys for downstream applications.

## Parent Labels

Some production catalogues need a key to be both a visible label and a parent
namespace. Until
[issue #10](https://github.com/link-foundation/lino-i18n/issues/10) is
implemented, author the label explicitly as a child key:

```lino
error
  label "Error"
  invalid
    github
      url "Error: Invalid GitHub URL format"
```

This resolves `error.label` today. Applications that must keep a historic
`error` key should add that alias outside `lino-i18n` for now.

## Migration Aliases

Hive Mind also had old mixed dotted + underscore keys such as:

```txt
telegram.help_solve_alias_detail
prompt.system_general_guidelines_body
```

Deep authoring now produces canonical dot keys such as
`telegram.help.solve.alias.detail`. Until
[issue #11](https://github.com/link-foundation/lino-i18n/issues/11) adds a
shared helper, migrations should keep explicit application-level aliases and
let explicit translations win over generated compatibility keys.

## Verification

This repository now keeps the Hive Mind-style fixture aligned across both
implementations:

- `js/tests/i18n.test.js` parses the deeply nested multiline fixture and checks
  the runtime sample catalogues.
- `rust/lino-i18n/tests/integration.rs` parses the same shape and checks both
  macro-loaded and runtime-loaded catalogues.
- `js/locales/*.lino` and `rust/lino-i18n/locales/*.lino` include the same
  production-style key families.
