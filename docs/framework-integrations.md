# Framework integration boundaries

The source runtime is instance-based. Frameworks can share immutable catalogs
but should create a translator for each server request and each independent
client application. The examples below describe integration points, not shipped
framework plugins. The tested surfaces are Web Request/Response helpers, React
server rendering and hydration, and the Vite/Rollup extraction plugin.

## Next.js and React server components

Call `createRequestTranslator(request, options)` in the request boundary, then
pass the result explicitly to `T`/`Tx` from `lino-i18n/react-server`. Pass its
snapshot as serializable data to a client component which creates a translator
and wraps children in `I18nProvider` from `lino-i18n/react`.

Use `localizePath`/`stripLocale` for supported path prefixes. Convert the optional
Web `Response` returned by `createLocaleMiddleware` to the framework's expected
response at its middleware boundary. Apply the application's caching rules to
localized pages; include locale/version in application cache keys. Generate
static paths and alternate-language SEO links using the supported locale list.
There is no built-in Next middleware matcher, Next cookie writer, link component
or SSG plugin. Those integrations require framework-specific tests.

## TanStack Start, React Router and Node servers

Pass a Web Request from a route loader to `createRequestTranslator`. For Node
HTTP servers, adapt the URL and headers to a Web Request, and place the instance
in request context. Supply the same snapshot to the React document renderer
and hydration entry. Use `localizePath` when constructing router links. Avoid
sharing a mutable translator between requests; there is no implicit
AsyncLocalStorage singleton.

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
