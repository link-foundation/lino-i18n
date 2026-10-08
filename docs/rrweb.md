# Record and replay `.lino` walkthroughs

The optional adapter reuses the published `gt-rrweb` recorder and player. It
converts approved ICU catalogs into their text overlays; it does not translate
through a service or rerender your app in each language. Recording and playback
have separate entrypoints so recorder pages need not bundle the player.

```sh
npm install lino-i18n react react-dom gt-rrweb @rrweb/record @rrweb/replay @rrweb/types
```

The integration tests pin `gt-rrweb` 0.2.0 and rrweb 2.1.7. Core/browser entries
retain their existing dependencies. Catalog conversion can also run in plain
code using `lino-i18n/rrweb/catalog`; harvesting needs `gt-rrweb/harvest`.

## Capture a source render

Use the replay entry's `T` for messages that contain variables or explicit ids.
It shares the React provider, markers and extraction identity, and adds a
`display: contents` message marker plus wrappers around simple variables. These
wrappers keep variables separate from adjacent literal text in the recorded DOM.
Ordinary `gt('A recorded welcome')` strings are matched by their exact source text.

```jsx
import { I18nProvider, T, Var, Recorder, useRecorder } from "lino-i18n/rrweb";
import { createTranslator } from "lino-i18n/messages";

const i18n = createTranslator();
const catalogs = {
  sourceLocale: "en",
  sources: { greeting: "Hello <c0>{name}</c0>!" },
  loadCatalog: async (locale) => {
    const response = await fetch(`/locales/${locale}.lino`);
    if (!response.ok) throw new Error(`Catalog unavailable: ${locale}`);
    return response.text();
  },
};

function Capture() {
  const { start, stop, status } = useRecorder();
  return (
    <>
      <main>
        <T id="greeting">
          Hello{" "}
          <strong>
            <Var name="name">Ada</Var>
          </strong>
          !
        </T>
      </main>
      <button
        disabled={status !== "idle"}
        onClick={() => start({ locales: ["en", "fr"] })}
      >
        Record
      </button>
      <button disabled={status !== "recording"} onClick={() => stop()}>
        Stop
      </button>
      <Recorder
        catalogs={catalogs}
        contentSelector="main"
        onComplete={(bundle) => saveRecording(bundle)}
        onError={console.error}
      />
    </>
  );
}

// Mount Capture inside <I18nProvider i18n={i18n}>.
```

```lino
fr
  greeting "Bonjour <c0>{name}</c0> !"
  "A recorded welcome" "Un accueil enregistré"
```

The captured locale must be `sourceLocale` and the first entry in `locales`.
For explicit ids, supply the source table or source `.lino` catalog. Without it,
the converter uses the id as the source message, which works for source identities.
Multiple `.lino` locale roots require an explicit locale; the loader selects its
requested root. Catalog parse/load failures keep that target locale on source
and call `catalogs.onError(error, locale)` when supplied.

`Recorder` calls `onComplete` after bounded harvesting, updating both the bundle
overlay and its `gt-i18n` event. The upstream `useRecorder().stop()` promise returns
the raw capture before this asynchronous callback finishes: save the callback's
bundle. `GTRecorder`, `RecordingOverlay`, `useRecorder`, frame options, capture
labels and the opt-in automation handle are also available with their actual
upstream types. A raw `GTRecorder` expects GT harvest encodings.

## Play a saved bundle

```jsx
import { GTReplayer } from "lino-i18n/rrweb/replay";

<GTReplayer
  bundle={bundle}
  initialLocale="fr"
  style={{ height: 540 }}
  switchLocalesAllowed={true}
  debug={false}
/>;
```

Give the player a definite height or size its parent; an unsized percentage-height
container can collapse. The actual player supplies playback controls, scrubbing,
cursor animation, theme/full-screen controls and locale switching. The React
wrapper destroys its frames and listeners on unmount. Plain browser code can call
`createGTReplayer(container, bundle, options)` and later `handle.destroy()`.

Plain code can produce overlays separately:

```js
import { harvestReplay } from "lino-i18n/rrweb/harvest";
const overlay = await harvestReplay(events, ["en", "fr"], catalogs);
```

`toReplayCatalog` and `createReplayLoader` expose conversion for other integrations.
They produce GT text leaves, not GT's translation-service wire format.

## Alignment, privacy and limits

Recorded variables retain their source values and formatting. The adapter checks
ordered variable names/types and literal positions against the source; reordered
variables, selects/plurals, changed leaf counts and unavailable translations stay
on source. It excludes **all** nodes inside a marked message from bare-text lookup,
including variables and unchanged literals. In the published harvester, a catalog
entry for `Ada` can otherwise replace a recorded `{name}` value with `Adele`.
Bare interpolated strings and bare strings with explicit ids lack sufficient
identity metadata; use replay `T`. Number/date formatting and variables rendering
multiple text nodes can also fall back when their recorded leaf counts differ.
Translations replace text only; they cannot create HTML, props or event handlers.

The actual GT recorder enables `maskAllInputs` and rrweb's `rr-block` behavior.
Mark content that must be excluded with `rr-block`; ordinary visible text and
variable values are recorded. The example uses artificial privacy markers and
checks that input values and blocked text are absent from the exported JSON.
Bounds below apply to **processing a finished recording**, not to the recorder's
capture duration or application-controlled catalog fetches.

| Budget                             | Default | Maximum |
| ---------------------------------- | ------- | ------- |
| Events                             | 30000   | 100000  |
| Objects/arrays throughout events   | 100000  | 200000  |
| Event string bytes (UTF-8)         | 10 MiB  | 50 MiB  |
| Each target/source catalog (UTF-8) | 10 MiB  | 50 MiB  |
| Entries per catalog                | 10000   | 100000  |
| Bytes per ICU message              | 64 KiB  | 256 KiB |
| ICU AST nodes per message          | 10000   | 50000   |
| Event/ICU depth                    | 100     | 200     |
| Target/source locale names         | 200     | 200     |

The options are `maxEvents`, `maxNodes`, `maxTextBytes`, `maxCatalogBytes`,
`maxEntries`, `maxMessageBytes`, `maxAstNodes` and `maxDepth`. Invalid bounds,
cycles and exceeded recording budgets reject before the recursive upstream
harvester runs. Events and their order remain unchanged by `harvestReplay`.

Run `npm run test:browser` in `js`; the real recording/player scenario also checks
source switching and unmount cleanup. Start `node examples/browser-usage/server.mjs`
and open `/examples/rrweb-usage/` for the runnable example.

![Source-language replay](screenshots/issue-25-rrweb-en.png)

![French replay with the original variable](screenshots/issue-25-rrweb-fr.png)

Primary references: [pinned GT rrweb source](https://github.com/generaltranslation/gt/tree/fb7584f5548b7454a7c95827de459c684f659d5b/packages/rrweb)
and [rrweb recording/privacy guide](https://github.com/rrweb-io/rrweb/blob/main/guide.md).
