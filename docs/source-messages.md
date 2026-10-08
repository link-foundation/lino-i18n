# Source messages, React content and extraction

`createTranslator` adds source-string translation and ICU MessageFormat to the
existing key-based API. Catalogs remain Links Notation. Use `createI18n` for the
existing interpolation and suffix-plural API, and `createTranslator` when you
want ICU, lazy loading, snapshots or source extraction.

## Plain JavaScript and TypeScript

```js
import { createTranslator, msg, bindMessage } from "lino-i18n/messages";

const i18n = createTranslator({
  defaultLocale: "fr",
  locales: { fr: { greeting: "Bonjour {name}", "Hello {v0}": "Salut {v0}" } },
});
const { gt } = i18n;
gt`Hello ${"Ada"}`; // Salut Ada
const greeting = msg("Hello {name}", {
  id: "greeting",
  description: "Greeting shown after login",
});
gt(greeting, { name: "Ada" }); // Bonjour Ada
i18n.m(bindMessage(greeting, { name: "Lin" })); // Bonjour Lin
gt("Welcome", {}, { id: "welcome", locale: "en" });
gt("{n, plural, =0 {No files} one {# file} other {# files}}", { n: 2 });
```

`gt` and `m` are bound to their instance and may be destructured. Plain strings
use their source as their catalog key. Tagged templates use `{v0}`, `{v1}`, etc.
for interpolated values; literal braces, apostrophes and `<` are escaped as ICU
text. `msg` defers translation until use; `msg(['Save', 'Cancel'])` declares an
array of descriptors. Explicit array ids receive `.0`, `.1`, etc. suffixes.

ICU supports nested select/plural, ordinals, exact matches, offsets, quoting,
number/date/time formats and skeletons through FormatJS. Missing translations
render the supplied source; missing variables and invalid ICU throw. Existing
`t(key, params)` keeps its original interpolation behavior.

```lino
fr
  greeting "Bonjour {name}"
  "Hello {v0}" "Salut {v0}"
  "Welcome" "Bienvenue"
```

Quoted source keys round-trip in both JavaScript and Rust, including spaces,
quotes, backslashes and newlines. Catalog keys are data, including `__proto__`.

## Dictionaries and derivation

`dictionary(key, values)` resolves the source from `sourceLocale` (default `en`)
and formats the selected translation as ICU. `dictionaryObject('actions')`
returns the dotted-key subtree. The extractor discovers static `defineDictionary`
declarations and inline schemas supplied to translator factories, including
array index paths. External dictionary files still need an explicit import/build
adapter; dynamic schemas produce diagnostics rather than being executed.

Use `defineDictionary` and `createDictionaryTranslator` when the dictionary has
arrays or needs typed paths:

```ts
import {
  defineDictionary,
  createDictionaryTranslator,
} from "lino-i18n/messages";
const schema = defineDictionary({
  actions: ["Save", "Cancel"],
  card: { title: "Hello {name}" },
});
const dictionary = createDictionaryTranslator(schema, {
  defaultLocale: "fr",
  locales: { fr: { "actions.0": "Enregistrer" } },
});
dictionary.dictionaryTree("actions"); // ['Enregistrer', 'Cancel']
dictionary.dictionaryTree("card.title", { name: "Ada" }); // Hello Ada
```

Schemas register source strings under dotted keys and preserve array/object
shape through snapshots. `dictionaryTree()` returns the whole tree, while
`dictionary.obj(prefix)` returns a subtree. React `useTranslations(prefix).obj()`
and Node `getTranslations(prefix).obj()` expose the same operation. TypeScript
rejects unknown paths and infers string/object/tuple output (typed paths cover
eight levels; runtime schemas allow twenty). The original `dictionaryObject`
retains its object representation of dotted keys. Schemas are copied/frozen;
cycles, sparse arrays, accessors, dotted/empty keys and excessive depth or node
count fail validation. Catalogs still store only source/translated strings.

```js
import { derive, declareStatic } from "lino-i18n/messages";
const action = condition ? "Save" : "Cancel";
gt`Click ${derive(action)}`;
gt("Click {action}", { action: derive(action) });
gt("{person, select, female {She} other {They}} is {personValue}.", {
  person: declareStatic("Ada", "female"),
});
```

`derive` inserts a finite literal into the source identity. The extractor
enumerates literals, conditional branches, constant local bindings, local
functions with static returns and literal dictionary values. It never executes
application code. At most 100 values/message variants and 20 derivation levels
are allowed; unsupported expressions produce diagnostics. Derived messages
should use source identities rather than explicit ids. Use ICU `Branch` for
larger alternatives and `Var` for arbitrary runtime content.

`declareStatic(value, context)` supplies `{person}` as a select context and
`{personValue}` as the actual value. These names deliberately differ from GT's
`declareVar` encoding. `bindMessage` binds values to a deferred descriptor; it
does not perform static derivation.

## React

```jsx
import { I18nProvider, T, Var, Plural, Currency, useGT } from "lino-i18n/react";

function Page({ name, count }) {
  const gt = useGT();
  return (
    <>
      <T>
        Hello{" "}
        <strong>
          <Var name="name">{name}</Var>
        </strong>
        !
      </T>
      <T>
        <Plural count={count} one="One file" other="Many files" />
      </T>
      <Currency currency="USD">{12.5}</Currency>
      <input aria-label={gt("Search")} placeholder={gt("Search")} />
    </>
  );
}
const app = (
  <I18nProvider i18n={i18n}>
    <Page name="Ada" count={2} />
  </I18nProvider>
);
```

`T` serializes code-owned HTML elements as ICU tags (`<c0>...</c0>`) and dynamic
values as named placeholders. Translations can reorder existing nodes; React
escapes text and retains the original element properties. Custom components
and self-closing elements are opaque placeholders, avoiding execution during
extraction. Use `<Var name="...">` for dynamic content. `Static` has the same
opaque preservation behavior; `<Derive>{action}</Derive>` expands finite literal
alternatives into separate messages.

`Plural` selects exact `zero`, cardinal or ordinal cases and requires `other`.
`Branch` selects from `cases={{ female: 'She', other: 'They' }}`. Inside `T`, all
branches form a single ICU message. Outside `T`, they select code-owned children.
Inside `T`, `#` in plural branch text substitutes the count. Outside `T`,
`Plural` selects its children without formatting their text.

The provider subscribes to locale, catalog, region and enabled-state changes.
Hooks include `useGT`, `useMessages`, `useTranslations(prefix)`, `useLocale`,
`useLocales`, `useSetLocale`, `useRegion`, `useSetRegion`, `useFormatLocale`,
`useDefaultLocale`, `useEnabled`, `useSetEnabled`, `useLocaleDirection` and
`useLocaleProperties`. Source hooks and dictionary hooks require a translator;
the existing `useTranslation`, `Trans` and provider support `createI18n` too.

`LocaleSelector` selects already loaded locales. For remote catalogs use
`useSetLocale`, which calls `switchLocale` when available and loads before
switching. `RegionSelector` selects an explicit list of regions. Formatting
components use the region-adjusted locale; ICU messages use the message locale.
Region codes are uppercase two-letter or three-digit codes.

`Num`, `Currency`, `DateTime`, `RelativeTime`, `RelativeDate` and `ListFormat`
accept an explicit `locale` override. Numeric/date components accept either a
`value` prop or children, including zero. `RelativeDate` requires `now` for
deterministic server rendering and hydration:

```jsx
<RelativeDate now="2026-01-01T00:00:00Z">2026-01-02T00:00:00Z</RelativeDate>
```

Run `node js/examples/browser-usage/server.mjs` from the repository root and open
`http://127.0.0.1:4173/examples/react-usage/`. The example builds with esbuild and demonstrates
English/French rich content, plurals, currency and locale switching.

## Loading, caching and server rendering

```js
const remote = createTranslator({
  version: "release-42",
  loadCatalog: async (locale, { version }) => {
    const response = await fetch(`/catalogs/${version}/${locale}.lino`);
    if (!response.ok)
      throw new Error(`Catalog load failed: ${response.status}`);
    return response.text();
  },
});
await remote.switchLocale("fr");
await remote.tx("Hello {name}", { name: "Ada" }, { locale: "fr" });
```

Concurrent loads share one promise per version/locale; failures can be retried.
An optional `cache` supplies `get(key)` and `set(key, table)`. Applications own
expiration and storage. `switchLocale` prevents older responses from overriding
the newest choice. `tx` loads for its per-call locale without changing the
instance's current locale. `setEnabled(false)` renders source messages; legacy
key-based `t` retains its existing behavior.

```jsx
import { createRequestTranslator } from "lino-i18n/server";
import { T, Tx } from "lino-i18n/react-server";

const requestI18n = await createRequestTranslator(request, {
  locales,
  supportedLanguages: ["en", "fr"],
});
const content = <T i18n={requestI18n}>Welcome</T>;
const deferred = <Tx i18n={requestI18n}>Welcome</Tx>;
const snapshot = requestI18n.snapshot();
// Serialize snapshot as data through the framework, then:
const clientI18n = createTranslator(snapshot);
```

The server entry has no client hooks or shared locale singleton. Every request
owns an instance. A JSON-round-tripped snapshot preserves catalogs, current
locale, fallbacks, enabled state, region and catalog version; functions such as
loaders/cache callbacks must be reattached on the client. Keep the same initial
snapshot for server output and hydration. React `Tx` is an async server
component, while plain `tx` returns a promise in any supported JS runtime.

Request negotiation considers an explicit locale, supported path prefix, locale
cookie, weighted `Accept-Language`, then the configured default. `localizePath`,
`stripLocale` and `createLocaleMiddleware` provide Web Request/Response routing
primitives. See [framework integration boundaries](framework-integrations.md).

Node applications can opt into scoped access through `lino-i18n/node`:

```js
import { withRequestTranslation, getGT, getLocale } from "lino-i18n/node";
await withRequestTranslation(request, { locales }, async () => {
  const greeting = getGT()("Welcome");
  return { locale: getLocale(), greeting };
});
```

`runWithTranslator(instance, callback)` reuses an existing instance.
`createTranslationContext()` creates an independent scope. AsyncLocalStorage
isolates overlapping requests and restores outer scopes after errors; helpers
throw outside a scope. `getTranslations(prefix)`, `getMessages`, `gt`, `tx` and
locale/version helpers use the active translator. Run
`node js/examples/request-context.mjs` for an overlapping-request example.

## Extraction, validation and translation providers

The optional [GT service bridge](gt-provider.md) provides ICU translation
candidates and versioned SDK downloads without adding credentials or service
dependencies to the core/browser entries.

```sh
lino-i18n extract --in src --out locales --locale en
lino-i18n check --dir locales --manifest locales/messages.json
lino-i18n check --dir locales --manifest locales/messages.json --previous-manifest previous/messages.json
lino-i18n translate-catalog --manifest locales/messages.json --dir locales --locale fr --provider ./provider.mjs --out candidates/fr.lino
```

The Babel-based extractor recognizes imported APIs, renamed imports, namespace
imports, local translator destructuring and hooks. Shadowed bindings are
ignored. Scoped Node helpers, asynchronous request factories and typed dictionary
declarations are recognized. It captures static source text, descriptions, ids,
file locations, rich JSX and all branch alternatives. Dynamic sources, unwrapped expressions,
spreads and conflicting ids fail extraction with diagnostics. Calls to `gt` in
HTML properties extract normally. Automatic attribute/text translation is an
opt-in compiler transform described below.

`extractMessages(code)`, `validateCatalog(messages, table)` and
`diffMessages(previous, current)` are also available from `lino-i18n/tooling`.
Validation finds missing/unused messages, invalid ICU, mismatched placeholder
and tag names. A previous manifest additionally flags translations under stable
ids whose source changed. A `stale` result requires review; after review advance
the baseline manifest. It does not infer whether a human has already corrected
the translation. Source-key changes naturally produce missing/unused entries.

```js
// provider.mjs: plug in a service, local model or human-reviewed catalog.
export default async function provider(
  messages,
  { locale, sourceLocale, signal },
) {
  return myTranslationService(messages, { locale, sourceLocale, signal });
  // Return { [message.id]: translatedIcuString } for every supplied message.
}
```

Provider calls receive only missing messages and must return valid strings with
the same variables/tags. Existing entries win. Candidates are written to an
explicit output file for review; the library does not ship API credentials or
claim to provide machine translation itself. The programmatic API accepts an
AbortSignal. Copy approved candidates into the catalog workflow you maintain.

```js
// vite.config.js / Rollup plugin list
import { createExtractionPlugin } from "lino-i18n/compiler";
export default { plugins: [createExtractionPlugin({ locale: "en" })] };
```

The plugin emits `locales/en.lino` and `messages.json`, checks conflicts, and resets
its state each build. Extraction alone is its default. Enable `transform` to
wrap JSX text in `T`, preserve expressions as `Var`, and translate configured
attributes through an existing in-scope `gt`/`m` function:

```js
createExtractionPlugin({
  transform: {
    attributes: ["placeholder", "aria-label", "title", "alt"],
    attributeTranslator: "gt",
    components: { "UI.Button": ["label"] },
  },
});
```

For example, a component with `const gt = useGT()` can author ordinary
`<p>Hello <strong>{name}</strong>!</p>` and `<input placeholder="Search" />`.
The compiler retains rich elements/event handlers, evaluates each expression
once, honors existing `T` boundaries, and emits source maps. Native tags receive
the configured attributes; custom/namespaced components require explicit
`components` configuration. Dynamic template attributes become tagged messages;
other runtime attribute values retain application-owned logic. Selected static
attributes with prop spreads fail with a diagnostic. The translator must be a
recognized constant lino function in scope, so shadowed/unrelated functions are
not called. `autoText: false` enables attribute transformation alone.

`transformJSX(code, options)` is available for other build tools. It preserves
JSX/TypeScript syntax; run the toolchain's ordinary transpiler afterward.
`serverTranslator: 'requestI18n'` selects server `T` imports and passes the
explicit instance. No global state or hooks are injected into application code.
Run the browser server and open `/examples/compiler-usage/` for a working JSX
example. Its automated browser test verifies French content, accessible labels,
locale changes and clicks; the Rollup fixture also verifies expression counts
and source-map composition.

## Pure locale utilities and Rust

`lino-i18n/intl` exports Intl-backed number, currency, date/time, relative time,
list and list-parts formatting, grapheme-safe cutoff, canonicalization, language
and dialect comparison, locale/region names, direction and flag helpers. A date
relative formatter takes an explicit `now`; month/year selection uses fixed
approximate durations rather than calendar arithmetic. Host Intl data controls
locale coverage and output.

`LocaleConfig` keeps catalog identities separate from canonical Intl tags:

```js
import { LocaleConfig } from "lino-i18n/intl";
const localeConfig = new LocaleConfig({
  defaultLocale: "company",
  locales: ["company", "fr"],
  customMapping: { company: { code: "en-US", name: "Company English" } },
  aliases: { english: "company" },
});
const configured = createTranslator({ localeConfig, locales });
localeConfig.determineLocale(["en-US", "fr-CA"]); // company
localeConfig.formatNum(1234.5, "company", { locales: "de" }); // 1.234,5
```

Mappings may supply `code`, `name`, `emoji` and `direction`; string entries
override names. Aliases can form chains, and cycles are rejected at construction.
Configuration is copied/frozen and snapshots contain plain serializable data.
Negotiation prioritizes exact identities, canonical tags, dialects and broad
language/script tags without switching writing systems. `isSupersetLocale` and
`requiresTranslation` expose the same rules. No matching approved target means
no translation is requested. Formatting methods accept per-call `locales`
overrides; relative dates require `baseDate`. Translator request negotiation,
ICU and React metadata/formatting use canonical tags while catalog keys retain
their custom identities. GT-specific message wire encodings are not decoded.

Rust adds `Message::new(source).id(key)`, `I18n::gt` and `I18n::m` while retaining
the existing runtime and macros. Enable `lino-i18n/icu` for `format_message` with
the FormatJS ICU engine. The optional engine requires Rust 1.92 or newer;
default features continue supporting Rust 1.87. JavaScript and Rust share
catalog syntax, not a byte-identical ICU rendering guarantee.

The native `lino-i18n/browser` entry remains dependency-free. It exposes the
existing translator and pure Intl helpers; source ICU, extraction and React
entries require a bundler or an environment that resolves npm packages.

For Next 16 App Router, the optional [Next adapter](next.md) provides server accessors, proxy cookies, snapshot hydration, localized navigation, static params and metadata.
