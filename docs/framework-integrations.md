# Framework integration boundaries

The source runtime is instance-based. Frameworks can share immutable catalogs
but should create a translator for each server request and each independent
client application. The tested framework adapter is Next 16 App Router; Web Request/Response,
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

Plain `createTranslator`, formatting helpers and `subscribe` can be used behind
an application adapter. React Native can use the provider/hooks with
code-owned native elements passed as variables; HTML selectors and automatic
native-element content traversal are not provided. Vue/Svelte can subscribe to
the instance and dispose subscriptions at component teardown, but this package
does not ship Vue directives, Svelte bindings or template extractors.

Extract shared `.js`/`.ts` message declarations with the CLI. Vue/Svelte template
extraction and native-language rich rendering need separate adapters and
fixtures before those modes can claim parity with GT's dedicated packages.
See the [requirement matrix](case-studies/issue-25/REQUIREMENTS.md) for the
implementation plans and explicit remaining gaps.
