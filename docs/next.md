# Next.js App Router

The optional `lino-i18n/next/server`, `/next/client` and `/next/proxy` entries
support Next 16. The checked example uses Next 16.4.0 and React 19.3. Next remains
an optional peer: importing the core, browser, React or Node entry does not load
it. Install Next in the application before using these entries.

## Server requests and static pages

Create one configuration module and one server factory:

```js
// i18n.js — imported by server components and route handlers
import { createNextI18n } from 'lino-i18n/next/server';
export const i18n = createNextI18n({
  defaultLocale: 'en',
  supportedLanguages: ['en', 'fr'],
  locales: { en: {}, fr: { Hello: 'Bonjour' } },
});
```

`await i18n.getTranslator()`, `getGT()`, `getMessages()`, `getTranslations(prefix)`
and `getLocale()` read the current request through Next's async `headers()`.
React `cache` scopes translator construction to the current server render;
omitted locale arguments and explicit `undefined` share a cache key. Independent
HTTP requests receive independent instances. Route handlers have Next request
context but do not have React render memoization: keep the returned instance
when making several calls in a handler.

`getTranslator(locale)`, `getGT(locale)` and the other source/dictionary accessors
accept an explicit supported catalog identity. That path avoids request headers
and can run during static generation. `generateStaticParams()` returns
`[{ locale: 'en' }, { locale: 'fr' }]` for an `app/[locale]` segment. Use its result
in the application's `generateStaticParams` export; await Next's `params` promise
and pass `params.locale` explicitly to the source helper. Unsupported explicit
locales reject. The fixture builds `/en/static` and `/fr/static` as static pages.

The factory's async `<i18n.T>` and `<i18n.Tx>` render source content with the
request translator. Import `Var`, `Static`, `Branch` and `Derive` from
`lino-i18n/next/server` for markers. The separately exported server `Plural`
accepts an explicit `i18n` instance, as in the ordinary React server entry.

`i18n.getMetadata(path, origin, locale)` returns Next's `alternates` object with
an absolute canonical URL, canonical-tag language URLs and `x-default`. Use a
trusted application origin and integrate this result into `generateMetadata`.
Custom catalog identities use `LocaleConfig` canonical tags for language keys.

## Locale proxy and navigation

```js
// proxy.js — configuration must be statically visible to Next
import { createNextLocaleProxy } from 'lino-i18n/next/proxy';
export const proxy = createNextLocaleProxy(options);
export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] };
```

The proxy chooses the supported path locale, then cookie, weighted
`Accept-Language` and default. It redirects unprefixed paths with HTTP 307,
retains the query, persists a `locale` cookie for document navigation and
forwards the selected locale
as `x-lino-locale` on the incoming request to the page. It replaces a conflicting
incoming locale header. `cookieName`, `persistLocale: false` and `cookieOptions`
control persistence. Set an application matcher that excludes API/internal/
asset paths; the example's dotted-path exclusion is a choice for this fixture.
Next strips Flight headers before calling Proxy, so browser background fetches
(`Sec-Fetch-Dest: empty`) do not change the preference cookie. The client link
and selection helpers handle persistence during App Router navigation.

Wrap a client subtree in `<NextI18nProvider snapshot={translator.snapshot()}>`.
Its source components, formatters and hooks use the hydrated instance.
`useSetLocale()` waits for a successful catalog switch, writes the cookie and
uses the App Router's `replace` with a locale prefix, retaining query/hash and
scroll position. Navigation fetches the destination server snapshot. The
provider's `cookieName` should agree with the proxy; its browser-written cookie
uses path `/`, SameSite Lax and Secure on HTTPS. Custom domain/path/HttpOnly
persistence needs application code instead of this browser hook.

`LocaleSelector` accepts the usual select props, locale labels and `onError`.
A failed switch calls that handler; the default reports the error to the console.
`LocaleLink` wraps Next Link, localizes root-relative string/URL-object hrefs and
preserves external/relative URLs. `locale` selects a catalog identity for the
link. It persists the locale through Next's `onNavigate` callback, including
navigation to an already-prefetched page. User callbacks run first and can
cancel without changing the cookie; prefetch, modified clicks, downloads and
external links do not trigger this callback. Source APIs are available from
`/next/client` alongside the core hooks.

## Reproducible checks and boundaries

Run `npm run build:next` and `LINO_NEXT_PRODUCTION=1 npm run test:next` from `js/`.
The test uses a production server, exercises hydration, cached server helpers,
client selection, cookies, query/hash, localized links, static routes and SEO,
and sends overlapping English/French HTTP requests. The example validates route
locale parameters with Next `notFound()` so asset filenames do not become invalid
locale codes; its static routes set `dynamicParams: false`. The regular unit suite
checks proxy headers, static source helpers and metadata; extraction recognizes
locally declared Next factories and their accessors. The Next-specific type
fixture uses the framework's usual `skipLibCheck`; core declarations retain the
existing strict check.

The example runs webpack and limits build workers to one. Pages Router,
Turbopack-specific transforms, domain routing, base paths, custom rewrites,
cache-component policies and hosted deployments have no conformance claim in
this adapter. Apply application cache keys/revalidation policies to locale and
catalog version. Next's production build and browser test are part of CI.

Primary references: [Next internationalization](https://nextjs.org/docs/app/guides/internationalization),
[async headers](https://nextjs.org/docs/app/api-reference/functions/headers),
[Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy),
[static params](https://nextjs.org/docs/app/api-reference/functions/generate-static-params),
[App Router navigation](https://nextjs.org/docs/app/api-reference/functions/use-router).
The installed Next 16.4.0 package's `dist/docs` guides were read for the example.
