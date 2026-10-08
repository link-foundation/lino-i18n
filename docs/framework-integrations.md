# Framework integration boundaries

The source runtime is instance-based. Frameworks can share immutable catalogs
but should create a translator for each server request and each independent
client application. Tested adapters cover Next 16 App Router, TanStack Start,
Vue and Native Text; Web Request/Response,
React server rendering/hydration and Vite/Rollup extraction are also tested.
Other framework sections describe integration points and their remaining limits.

## Next.js and React server components

The optional `lino-i18n/next/server`, `/next/client` and `/next/proxy` entries
provide request-scoped server helpers, snapshot hydration, locale cookies,
localized links/navigation, static params and alternate-language metadata.
The [Next guide](next.md) documents the API, production App Router fixture,
concurrent request and hydration checks, and application-specific boundaries.
See `js/examples/next-usage`. Next remains an optional peer dependency.

## TanStack Start, React Router and Node servers

The optional `lino-i18n/tanstack-start/server` and `/client` entries provide
request middleware, ambient server access, loader snapshots, hydration and
locale-aware Router links/selectors. The [Start guide](tanstack-start.md) includes
the actual production build and browser fixture, server-only setup and limits.

Pass a Web Request from a route loader to `createRequestTranslator`. For Node
HTTP servers, adapt the URL and headers to a Web Request, and place the instance
in request context. Supply the same snapshot to the React document renderer
and hydration entry. Use `localizePath` when constructing router links. Avoid
sharing a mutable translator between requests. The optional `lino-i18n/node`
entry provides `withRequestTranslation` and `runWithTranslator` scopes with
AsyncLocalStorage, plus scoped source/dictionary and locale helpers. It is
tested with overlapping, nested and failed requests; it adds no Node imports
to the browser or Web Request entry. See `js/examples/request-context.mjs`.

## Workers and other Web Request runtimes

The server helpers use standard `Request`, `Response`, URL and Intl rather than
Node filesystem APIs. Import `lino-i18n/server` and supply inline catalogs or a
fetch loader; bundle the npm dependencies for the target platform. The Node
CLI's filesystem APIs belong in the build process. Platform deployment and
revalidation APIs remain application responsibilities.

## React Native, Vue and Svelte

The [Native adapter](react-native.md) uses injected Text, rich traversal, native
formatter wrappers, headless selectors and serialized locale persistence.
The [Vue adapter](vue.md) provides a reactive plugin, source components,
composables, SSR snapshots and bounded SFC extraction. Both have real framework
fixtures. Svelte applications can subscribe to `createTranslator` and dispose
subscriptions on teardown; dedicated Svelte bindings remain outside the package.

Extract shared `.js`/`.ts` message declarations with the CLI. Vue templates and
Native Text imports use the shipped extractors; Svelte templates need an adapter.
See the [requirement matrix](case-studies/issue-25/REQUIREMENTS.md) for the
implementation plans and explicit remaining gaps.

## Session replay

The [rrweb adapter](rrweb.md) reuses the published GT recorder/player with bounded `.lino` ICU harvesting. Marked source messages preserve recorded variables; real Chromium recording/playback tests cover translated mutations, privacy markers, locale switching and cleanup.
