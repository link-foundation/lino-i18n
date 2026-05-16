# External References

Captured 2026-05-16. Sources are GitHub or registry APIs.

## Dependency stack (foundation)

| Repo | Description | Latest npm | Latest crates.io |
| ---- | ----------- | :--------: | :--------------: |
| [`link-foundation/links-notation`](https://github.com/link-foundation/links-notation) | Reference parser/formatter for Links Notation | `links-notation@0.13.0` | `links-notation = "0.13"` |
| [`link-foundation/lino-objects-codec`](https://github.com/link-foundation/lino-objects-codec) | Encode/decode object graphs to/from Lino | `lino-objects-codec@0.4.0` | `lino-objects-codec = "0.2"` |
| [`link-foundation/lino-arguments`](https://github.com/link-foundation/lino-arguments) | Unified CLI args + env vars + lino config | `lino-arguments@0.3.0` | `lino-arguments = "0.3"` |

## Reference JS/TS i18n libraries

| Library | npm name | Latest version (as of writing) | License | Repo |
| ------- | -------- | :----------------------------: | :-----: | ---- |
| i18next | `i18next` | 23.x | MIT | https://github.com/i18next/i18next |
| i18n-js | `i18n-js` | 4.x | MIT | https://github.com/fnando/i18n |
| react-intl | `react-intl` | 6.x (FormatJS) | BSD-3 | https://github.com/formatjs/formatjs |

## Companion tooling consulted

| Project | Why it matters |
| ------- | -------------- |
| `link-assistant/hive-mind` | Existing production usage of `.lino` files for i18n in a CLI/Telegram bot. See `src/i18n.lib.mjs`. |
| `link-foundation/rust-ai-driven-development-pipeline-template` | Best-practice CI/CD layout for the Rust portion. |
| `rust-i18n` crate | Existing build-time translation embedding macro (YAML/JSON). Inspires the proc-macro API. |
| `fluent-rs` / `fluent-templates` | Mozilla Fluent compile-time embedding (FTL format). Confirms the macro-based pattern is mainstream. |
