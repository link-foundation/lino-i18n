# Issue 19: General Translation workflows over Links Notation

Issue: <https://github.com/link-foundation/lino-i18n/issues/19>

Reference: <https://github.com/generaltranslation/gt>

Investigated: 2026-07-12

## Scope and boundary

The issue asks for the strongest ideas in General Translation (GT), especially
its React and framework workflows, while retaining Links Notation (`.lino`) as
the catalogue source. GT is a large monorepo rather than one feature: its
current packages cover pure JavaScript, React, React Native, Next.js, TanStack
Start, Sanity, source compilers, linting, a CLI, an MCP server, translation
services, and locale/format utilities.

This pull request delivers the first complete framework layer: an observable
runtime and optional React adapter. It records every identified requirement and
a staged solution for the remaining integrations. It does not claim that a
local catalogue library can reproduce GT's hosted translation/CDN services
without a separate service protocol and credentials model.

## Primary evidence

- GT source and package inventory: <https://github.com/generaltranslation/gt>
- React overview: <https://generaltranslation.com/docs/react/introduction>
- Provider API: <https://generaltranslation.com/docs/react/api/components/gtprovider>
- Dictionary hooks: <https://generaltranslation.com/docs/react/api/dictionary/use-translations>
- Branching components: <https://generaltranslation.com/docs/react/guides/branches>
- CLI workflow: <https://generaltranslation.com/docs/cli/translate>
- Next locale routing: <https://generaltranslation.com/docs/next/guides/middleware>
- React external stores: <https://react.dev/reference/react/useSyncExternalStore>
- ECMA-402 internationalization APIs: <https://tc39.es/ecma402/>
- Unicode locale identifiers: <https://www.unicode.org/reports/tr35/#Unicode_locale_identifier>

The GT repository was inspected on its `main` branch on the investigation date.
The inventory is time-specific because that project changes frequently.

## Requirements matrix

| Area | Requirement for lino-i18n | Status or proposed solution |
| --- | --- | --- |
| Storage | `.lino` remains authoritative; catalogues may be split or bundled | Existing loaders |
| Lookup | Interpolation, plurals, context, fallback, missing keys, key scopes | Existing runtime plus `useTranslation(prefix)` |
| Reactive state | Locale/catalogue mutations notify UIs without framework code in core | Implemented `subscribe` and `getRevision` |
| React context | Optional provider around a caller-owned runtime | Implemented `I18nProvider` |
| Hooks | Stable translator, current locale, nested dictionary scope | Implemented `useI18n`, `useLocale`, `useTranslation` |
| Declarative content | Translate a key while preserving explicit React values | Implemented `Trans` |
| Locale UI | Enumerate and switch loaded locales | Implemented `LocaleSelector` |
| Formatting | Numbers, dates, currency, relative time using active BCP-47 locale | Four `Intl`-backed components |
| Branches | CLDR plural and context selection | Existing `t(key, { count, context })`; wrappers are syntax sugar |
| Lazy catalogues | Async `.lino` loads rerender consumers | Existing loaders now notify through `addLocale` |
| SSR | Per-request instances and deterministic server snapshot | Adapter supports this; framework owns request isolation |
| React Native | Native locale discovery and polyfills | Planned optional adapter; no native code in core |
| Next.js | Request locale, middleware, localized links, RSC boundaries | Planned after routing semantics are specified |
| TanStack Start | Router/server integration | Planned thin adapter over request primitives |
| Extraction | Deterministically find translated JSX and string calls | Planned AST compiler and versioned manifest |
| Validation | Detect missing/unused keys and placeholder drift in CI | Extend existing `check` command with extraction manifest |
| Translation automation | Provider-neutral translation into reviewable `.lino` diffs | Planned separately; environment-only credentials |
| Cache/CDN | Versioned remote snapshots with local fallback | Planned content hashes, integrity, cache adapter |
| Rich JSX | Reorder safe nodes and validate structure | Explicit values work now; arbitrary trees need compiler schemas |
| ICU/imports | Preserve migration from existing frameworks | Existing converters; full ICU parser remains future work |
| Tooling | Setup, linter, MCP/editor workflows | Planned after extraction format stabilizes |
| Observability | Missing-key reporting and opt-in tracing | Existing callback; structured trace events proposed |

## Architecture decision

```text
.lino -> loaders -> createI18n instance -> framework adapter
                         |                    |
                         |                    +-> React provider/hooks/components
                         +-> CLI, Node, Bun, Deno, Rust consumers
```

The observable contract is deliberately small. `subscribe(listener)` returns
an unsubscribe function and `getRevision()` returns a monotonic snapshot.
Mutations notify only after state changes. React consumes this contract with
`useSyncExternalStore`, which supports concurrent rendering and server
snapshots without putting React lifecycles into the core runtime.

React is an optional peer dependency behind the explicit `lino-i18n/react`
export. Importing the main package in another environment neither requires nor
evaluates React.

## Rich-value design

`Trans` looks up an explicit catalogue key; it does not translate arbitrary UI
at runtime. React-element values become private-use-delimited index markers
during string interpolation and are restored as cloned elements afterward.
Translations can reorder those values without raw HTML or
`dangerouslySetInnerHTML`. Scalar values use normal interpolation.

Automatic arbitrary-JSX translation is intentionally deferred. It requires a
compiler-generated structural schema, stable node identifiers, an attribute
allowlist, and validation that translated content cannot inject executable
properties.

## Workflows

### React client

1. Load `.lino` catalogues and create one runtime instance.
2. Place `I18nProvider` above translated consumers.
3. Use `useTranslation` for strings/attributes and `Trans` for messages with
   formatted React values.
4. Switch locale through `LocaleSelector` or `useI18n().setLocale(locale)`.

### Server rendering

Create one instance per request and set its initial locale before rendering.
Never share a mutable instance across requests. Serialize only catalogues
needed to hydrate the matching client instance. The adapter supplies a stable
server snapshot, while request isolation stays the framework's responsibility.

### Lazy local data

`loadLocale`, `loadLocaleFile`, and `loadDirectory` flow through `addLocale`,
increment the revision, and rerender consumers. A future fetch adapter should
add deduplication, abort handling, integrity, and stale-cache policy without
changing the observable contract.

## Alternatives considered

- **React in the main entry point:** rejected because CLI, Deno, server-only,
  and other-framework users would inherit a React dependency.
- **Generated JSON as another source of truth:** rejected. A snapshot may be a
  reproducible, content-hashed build artifact; human edits stay in `.lino`.
- **Runtime arbitrary-JSX translation:** rejected as nondeterministic and unsafe
  without compiler metadata, particularly across SSR/hydration.
- **One AI vendor in the core:** rejected. A translation provider should accept
  normalized entries and return candidates plus provenance so hosted,
  self-hosted, and human workflows remain possible.

## Staged solution plan

### Stage 1 — delivered

- Observable runtime mutations.
- React provider, hooks, keyed rich translation, selector, and formatters.
- Types, optional peer dependency, documentation, tests, and changeset.

### Stage 2 — extraction and validation

- Versioned manifest with key, default text, placeholders, source location,
  description, and structural schema.
- Babel/TypeScript extraction for `Trans` and translation calls.
- Missing/unused key and placeholder-drift checks with deterministic dry runs.

### Stage 3 — framework adapters

- Next request helpers, server/client entry points, middleware, localized links.
- React Native locale discovery in an optional native adapter.
- TanStack Start integration reusing request and routing primitives.
- Explicit BCP-47 negotiation and fallback rules.

### Stage 4 — translation workflow

- Provider-neutral batch interface and incremental content hashes.
- Reviewable `.lino` output with provenance outside visible strings.
- Retry/rate-limit policy, secret redaction, offline dry run, human review.

### Stage 5 — rich-tree compiler

- Stable JSX placeholders and attribute allowlist.
- Structural validation, compile-time replacement, code splitting, source maps,
  bundler plugins, and performance budgets.

## Verification and risks

Tests cover no-op locale changes, notifications, unsubscribe, hook rerenders,
key prefixes, interpolation, React-element values, locale-aware numbers,
selection, and misuse outside the provider. Package dry-run and existing tests
guard the publish surface and framework-independent behavior.

Before later stages, maintainers must decide locale negotiation semantics and
translation-provider boundaries. Large multi-file loads may benefit from
batched notifications. Server adapters must enforce request-scoped instances.
Rich trees need a threat model for translated markup, provenance, secrets, and
supply-chain integrity.
