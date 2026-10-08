# lino-i18n Changelog

## 0.4.0

### Minor Changes

- Add source-message and ICU translation, rich React content and branches,
  request-isolated server helpers, locale utilities, lazy catalog caching,
  AST extraction, catalog validation, provider-based translation candidates,
  and a Vite/Rollup extraction plugin over Links Notation.
  Add finite static derivation, ICU dictionaries and source-change review checks.
  Add typed dictionary schemas, canonical/custom locale configuration, scoped Node
  request access, automatic JSX/attribute compilation and an optional GT SDK bridge.
  Round-trip quoted source keys without interpreting prototype property names.
  Preserve complete ICU semantics when converting compiled FormatJS catalogs.

  Add an optional Next 16 App Router adapter for request-scoped server access, hydration, locale proxy/cookies, localized navigation, static params and SEO, verified with a production build and browser tests.

  Resolve shared translator factories, imported finite derivation and dictionary schemas through bounded static module graphs in the CLI and Vite/Rollup plugin.

  Add optional Vue 3.5 reactive source components, formatting, lazy initialization and SSR snapshots, plus SFC/module-aware extraction and CLI integration with compiler and browser regression coverage.

  Add bounded Python AST extraction into shared manifests, optional upstream Markdown helpers with safe entity serialization, and a GT service locale registry bridge.

  Add an injected React Native Text adapter with rich content, native formatter wrappers, headless selectors, serialized locale persistence and matching JSX extraction.

  Add optional TanStack Start request middleware and Router hydration/navigation adapters, verified with actual server functions, a production build and browser tests.

  Add optional rrweb recording/replay over `.lino` catalogs using the published GT player/recorder, bounded ICU harvesting, stable variable leaves and protected source values, with an actual browser privacy/playback regression.

  Add an optional ESLint flat-config plugin sharing the static extractor, with source/JSX/headless-Branch diagnostics, explicit named-variable suggestions and bounded analysis.

  Repair release verification and CI change detection, audit dependencies, and preserve translation behavior while resolving lint warnings.

  Update all JavaScript dependencies to their latest releases (`links-notation` 0.23, `lino-objects-codec` 0.9, ESLint 10.12, Prettier 3.9, Playwright 1.64, React 19.3 typings) and raise the supported Node.js floor to 22.11, which `lino-objects-codec` 0.9 requires; Node.js 20 reached end of life on 2026-04-30.

## 0.3.0

### Minor Changes

- f73aa48: Add a tree-shakeable browser entry point with URL-based Links Notation catalog loading, navigator language detection, and the shared translation runtime.

## 0.2.0

### Minor Changes

- 8e331fd: Add reactive runtime subscriptions and first-class React bindings with provider,
  translation hooks, rich interpolation, locale selection, and Intl formatters.

## 0.1.1

### Patch Changes

- 22cf52e: Document the Hive Mind deep catalogue authoring pattern and keep JS examples aligned.

## 0.1.0

### Minor Changes

- 4c3b133: Add configurable compatibility aliases for deeper nested migration keys.

## 0.0.2

### Patch Changes

- 29f0d6f: Preserve scalar parent translations as `label` children when formatting nested
  catalogues, and resolve `foo` from `foo.label` when no explicit `foo`
  translation exists.

## 0.0.1

Initial release of the JavaScript `lino-i18n` package.

- Runtime i18n API with `.lino` catalogue loading.
- Converter CLI for i18next, i18n-js, and react-intl catalogues.
- Node.js, Bun, and Deno test coverage.
- Automated npm publishing, GitHub release creation, and generated docs
  deployment through `.github/workflows/js.yml`.
