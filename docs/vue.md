# Vue source messages and SFC extraction

Install Vue 3.5 or later in the 3.x series. `lino-i18n/vue` is an optional entry;
Vue is never imported by the core or native browser entry.

```js
import { createApp } from "vue";
import { createVueI18n } from "lino-i18n/vue";

const plugin = createVueI18n({
  defaultLocale: "fr",
  sourceLocale: "en",
  locales: { fr: { "Hello {name}": "Bonjour {name}" } },
});
await plugin.initialize();
const { default: App } = await import("./App.vue");
createApp(App).use(plugin).mount("#app");
```

`initialize()` loads the active translation catalog before mounting, deduplicates
concurrent loads and allows retry after failure. The source locale needs no
download. Supply `loadCatalog` and `cache` as in the
[source-message guide](source-messages.md) for versioned lazy loading. The plugin
also accepts `{ i18n }` with an existing `createTranslator` instance. Module code
can use the explicit `plugin.gt`/`plugin.m` functions after initialization.

```vue
<script setup>
import { T, Var, LocaleSelector, useGT, useLocale } from "lino-i18n/vue";
const gt = useGT();
const locale = useLocale(); // readonly computed ref; templates unwrap it
const name = "Ada";
</script>

<template>
  <main :lang="locale">
    <T
      >Hello <Var name="name">{{ name }}</Var></T
    >
    <p>{{ gt("Ready") }}</p>
    <LocaleSelector :locales="['en', 'fr']" @error="console.error" />
  </main>
</template>
```

Call `gt` and dictionary functions inside a render function or computed expression
to subscribe to changes; a one-time assignment in `setup` remains a one-time
translation. `useLocale`, `useLocales`, `useRegion`, `useEnabled`,
`useDefaultLocale`, `useLocaleDirection` and `useLocaleProperties` return computed
refs. `useSetLocale` returns an async switch function with the runtime's latest
selection guard; `useSetRegion` and `useSetEnabled` update the same instance.
`useTranslations(prefix)` provides dictionary calls and `.obj` subtrees.

`T`, `Var`, `Static`, `Derive`, `Branch` and `Plural` use the same structural ICU
identities as React. Native tags restore original props, event handlers and refs;
custom components remain opaque. Translations cannot create HTML props or custom
components. Put dynamic content in a named `Var`; provide `cases` and an `other`
case for branching. In SFCs, named `<template #one>`/`<template #other>` slots supply rich plural cases; `Branch` accepts named case slots too. A bare `ordinal` attribute selects ordinal rules.

`Num`/`NumberFormat`, `Currency`/`CurrencyFormat`, `DateTime`/`DateTimeFormat`,
`RelativeTime`/`RelativeTimeFormat`, `RelativeDate` and `ListFormat` accept explicit
`value` (or `values` for lists), `locale` and native Intl `options` props.
`RelativeDate` requires `now`. `LocaleSelector` and `RegionSelector` are HTML
selects, accept labels and ordinary attributes, emit `change` after success and
`error` after failure, and restore the previous visible selection on failure.
Cookie persistence and router integration belong to the application.

For SSR, create a translator/plugin for each request, preload it, render with
`createSSRApp`, and hydrate with the same serialized `i18n.snapshot()` and
`createSSRApp`. SSR composables retain no subscribers; client subscriptions are
released with their component scopes. This follows Vue's guidance about
[request state and hydration](https://vuejs.org/guide/scaling-up/ssr.html),
[render functions](https://vuejs.org/api/render-function) and
[bundle feature flags](https://vuejs.org/api/compile-time-flags.html).

## Extraction

Install `@vue/compiler-sfc` in the same supported Vue version range for the
optional `lino-i18n/vue/extract` entry:

```js
import { extractVueMessages, extractVueProject } from "lino-i18n/vue/extract";
const manifest = extractVueMessages(sfcSource, { file: "Greeting.vue" });
const projectManifest = extractVueProject({
  "Greeting.vue": sfcSource,
  "i18n.ts": sharedTranslatorSource,
});
```

```bash
lino-i18n extract --in src --syntax vue --out locales --locale en
```

A single `.vue` file selects this parser automatically. Directory mode includes
SFCs and ordinary JS/TS modules, resolves imported source functions through the
bounded module graph and preserves source locations. The SFC parser supplies
Vue's condensed template whitespace; the same existing AST extractor handles
ICU variables, rich tags, descriptions, aliases and static branch cases. Source
code is parsed without executing the application.

Templates respect `v-for` and slot binding scopes and preserve `v-pre` literals.
Dynamic text requires `Var`. Loops/conditionals inside a single message do not
have a static identity; author a `T` inside the loop or explicit `Branch`/`Plural`
cases. The parser accepts HTML templates and inline scripts, with a one-MiB SFC
default limit, 10,000 template nodes and 100 nested levels. Project file/byte
limits and diagnostics are shared with JS extraction. External script/template
files, preprocessors, Options API template bindings and Nuxt/router/compiler
plugins are outside the tested adapter. Arbitrary raw `Static` VNodes remain
opaque; the actual Vue compiler fixture verifies ordinary compiled rich content.

The versioned [Vue example](../js/examples/vue-usage/shared.js) serves real SSR
HTML, hydrates it and demonstrates switching, failed loads, formatters and
preserved event handlers. Tests use Vue/compiler/server-renderer 3.5.43 and two
Chromium browser scenarios; SFC fixtures also prove source identity with the
actual compiler and server renderer.

![Vue example in English](screenshots/issue-25-vue-en.png)

![Vue example in French](screenshots/issue-25-vue-fr.png)
